import { AuditEvent, AuditResult } from '../audit/entities/audit-event.entity';
import {
  Recipient,
  RecipientStatus,
} from '../recipients/entities/recipient.entity';
import { ReleasePolicy } from '../release/entities/release-policy.entity';
import { AssignItemDto } from './dto/assign-item.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
  LegacyItem,
  LegacyItemStatus,
  LegacyItemType,
} from './entities/legacy-item.entity';

import { VaultService } from '../vault/vault.service';
import { EncryptionService } from '../encryption/encryption.service';
import { StorageService } from '../storage/storage.service';
import { S3StorageService } from '../storage/s3-storage.service';
import { Optional } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PlanEntitlementService } from '../subscriptions/plan-entitlement.service';
import { PlanLimit } from '../subscriptions/subscription.constants';
import { UpdateLegacyItemDto } from './dto/update-legacy-item.dto';
import { ReauthService } from '../users/reauth.service';

type PayloadStorageType = 'INLINE_DB' | 'S3' | 'LOCAL';

// Titles are encrypted at rest. Older rows without this prefix are plaintext.
const SEALED_TITLE_PREFIX = 'enc1:';

// Stored file types are limited to formats the app can export safely. Anything
// else (HTML, SVG, scripts) is kept as opaque bytes.
const ALLOWED_MIME_TYPES = [
  /^image\/(png|jpe?g|gif|webp|heic|heif|bmp|tiff)$/,
  /^video\/[\w.+-]+$/,
  /^audio\/[\w.+-]+$/,
  /^text\/(plain|csv)$/,
  /^application\/(pdf|rtf|zip|msword|vnd\.ms-excel|vnd\.ms-powerpoint)$/,
  /^application\/vnd\.openxmlformats-officedocument\.[\w.+-]+$/,
  /^application\/vnd\.oasis\.opendocument\.[\w.+-]+$/,
];

// ISO-BMFF brands that are still images or audio rather than video.
const NON_VIDEO_BRANDS = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'mif1',
  'msf1',
  'avif',
  'M4A ',
  'M4B ',
]);

interface CapacityUsage {
  isText: boolean;
  isVideo: boolean;
  bytes: number;
}

function positiveSetting(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
interface StoredEnvelope {
  encryptedDataKey: string;
  keyIv: string;
  keyAuthTag: string;
  iv: string;
  authTag: string;
  algorithm?: string;
  keyVersion?: string;
  ciphertext?: string;
}
interface ItemKeyRef extends StoredEnvelope {
  storageType?: PayloadStorageType;
  storageKey?: string;
  s3Uri?: string;
  checksumSha256?: string;
  sizeBytes?: number;
  mimeType?: string;
  description?: StoredEnvelope;
  fileMetadata?: StoredEnvelope;
  contentKind?: 'VIDEO';
}

@Injectable()
export class LegacyItemsService {
  private readonly storageService: StorageService;

  constructor(
    @InjectRepository(LegacyItem)
    private readonly itemRepository: Repository<LegacyItem>,
    @InjectRepository(Recipient)
    private readonly recipients: Repository<Recipient>,
    @InjectRepository(ReleasePolicy)
    private readonly policies: Repository<ReleasePolicy>,

    private readonly vaultService: VaultService,

    private readonly encryptionService: EncryptionService,

    @Optional() storageService?: StorageService,
    @Optional()
    private readonly planEntitlementService?: PlanEntitlementService,
    @Optional()
    private readonly reauthService?: ReauthService,
  ) {
    this.storageService =
      storageService ?? new StorageService(new S3StorageService());
  }

  async create(
    userId: string,
    data: {
      type: LegacyItemType;
      category: string;
      title: string;
      description?: string;
      requestKey?: string;
    },
  ) {
    // Get vault belonging to authenticated user
    const vault = await this.vaultService.getUserVault(userId);

    const encryptedDescription = data.description
      ? this.encryptionService.encrypt(Buffer.from(data.description, 'utf8'))
      : null;

    const item = this.itemRepository.create({
      vaultId: vault.id,
      requestKey: data.requestKey ?? null,
      requestHash: this.requestHash(data),

      type: data.type,
      category: data.category,
      title: this.sealTitle(data.title),
      // Sensitive item details are encrypted before persistence. The list
      // endpoint intentionally returns metadata only, not plaintext.
      description: null,

      ciphertextRef: encryptedDescription
        ? encryptedDescription.ciphertext.toString('base64')
        : null,

      encryptionKeyRef: encryptedDescription
        ? JSON.stringify({
            storageType: 'INLINE_DB',
            keyVersion: encryptedDescription.keyVersion,
            encryptedDataKey: encryptedDescription.encryptedDataKey,
            keyIv: encryptedDescription.keyIv,
            keyAuthTag: encryptedDescription.keyAuthTag,
            iv: encryptedDescription.iv,
            authTag: encryptedDescription.authTag,
            algorithm: encryptedDescription.algorithm,
          })
        : null,

      encryptionKeyVersion: encryptedDescription?.keyVersion ?? null,
      payloadStorageType: 'INLINE_DB',

      status: LegacyItemStatus.ACTIVE,
    });

    return this.withPlainTitle(
      await this.saveWithinCapacity(userId, item, {
        isText: data.type === LegacyItemType.TEXT,
        isVideo: data.type === LegacyItemType.VIDEO,
        bytes: 0,
      }),
    );
  }

  async createEncryptedUpload(
    userId: string,
    data: {
      type: LegacyItemType;
      category: string;
      title: string;
      description?: string;
      requestKey?: string;
    },
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname?: string;
    },
  ) {
    const fileBuffer = Buffer.isBuffer(file?.buffer)
      ? file.buffer
      : file?.buffer
        ? Buffer.from(file.buffer as any)
        : null;

    if (!fileBuffer || !fileBuffer.length) {
      throw new BadRequestException('A file is required.');
    }
    if (fileBuffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException('Files must be 25 MB or smaller.');
    }

    const mimeType = this.safeMimeType(file?.mimetype);
    const vault = await this.vaultService.getUserVault(userId);

    const isVideo =
      data.type === LegacyItemType.VIDEO ||
      mimeType.startsWith('video/') ||
      this.looksLikeVideo(fileBuffer);

    const encryptedFile = this.encryptionService.encrypt(fileBuffer);

    const savedStorage = await this.storageService.saveVaultItemFile({
      vaultId: vault.id,
      ciphertext: encryptedFile.ciphertext,
      mimeType,
      // Object metadata is not encrypted: never place titles or categories here.
      metadata: { itemType: data.type },
    });

    const encryptedDescription = data.description
      ? this.encryptInline(data.description)
      : null;
    const fileMetadata = file?.originalname
      ? this.encryptInline(
          JSON.stringify({ fileName: this.safeFileName(file.originalname) }),
        )
      : undefined;

    const item = this.itemRepository.create({
      vaultId: vault.id,
      requestKey: data.requestKey ?? null,
      requestHash: this.requestHash(data, fileBuffer),
      type: data.type,
      category: data.category,
      title: this.sealTitle(data.title),
      description: null,
      ciphertextRef: savedStorage.storageKey,
      encryptionKeyRef: JSON.stringify({
        encryptedDataKey: encryptedFile.encryptedDataKey,
        keyVersion: encryptedFile.keyVersion,
        keyIv: encryptedFile.keyIv,
        keyAuthTag: encryptedFile.keyAuthTag,
        iv: encryptedFile.iv,
        authTag: encryptedFile.authTag,
        algorithm: encryptedFile.algorithm,
        mimeType,
        storageType: savedStorage.storageType,
        storageKey: savedStorage.storageKey,
        s3Uri: savedStorage.s3Uri,
        checksumSha256: savedStorage.checksumSha256,
        sizeBytes: savedStorage.sizeBytes,
        description: encryptedDescription || undefined,
        fileMetadata,
        contentKind: isVideo ? 'VIDEO' : undefined,
      }),
      encryptionKeyVersion: encryptedFile.keyVersion,
      payloadStorageType: savedStorage.storageType,
      status: LegacyItemStatus.ACTIVE,
    });

    try {
      const saved = await this.saveWithinCapacity(userId, item, {
        isText: data.type === LegacyItemType.TEXT,
        isVideo,
        bytes: fileBuffer.length,
      });
      if (saved.ciphertextRef !== savedStorage.storageKey) {
        await this.storageService.deleteVaultItemFile(savedStorage.storageKey);
      }
      return this.withPlainTitle(saved);
    } catch (error) {
      await this.storageService.deleteVaultItemFile(savedStorage.storageKey);
      throw error;
    }
  }

  private requestHash(
    data: {
      type: string;
      category: string;
      title: string;
      description?: string;
    },
    file?: Buffer,
  ) {
    const hash = createHash('sha256').update(
      JSON.stringify([
        data.type,
        data.category,
        data.title,
        data.description ?? '',
      ]),
    );
    if (file) hash.update(file);
    return hash.digest('hex');
  }

  /**
   * Saves a new item after checking plan limits and vault quotas. The vault
   * lock makes the count and insert atomic, so parallel requests cannot all
   * pass the same check.
   */
  private async saveWithinCapacity(
    userId: string,
    item: LegacyItem,
    usage: CapacityUsage,
  ) {
    return this.itemRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `vault-items:${item.vaultId}`,
      ]);
      const repository = manager.getRepository(LegacyItem);
      if (item.requestKey) {
        const saved = await repository
          .createQueryBuilder('item')
          .addSelect(['item.requestHash', 'item.ciphertextRef'])
          .where('item.vaultId = :vaultId AND item.requestKey = :requestKey', {
            vaultId: item.vaultId,
            requestKey: item.requestKey,
          })
          .getOne();
        if (saved) {
          if (saved.requestHash !== item.requestHash)
            throw new ConflictException(
              'This request already saved different content. Start a new item to save changes.',
            );
          return saved;
        }
      }
      await this.assertCapacity(manager, userId, item.vaultId, usage);
      return repository.save(item);
    });
  }

  private async assertCapacity(
    manager: EntityManager,
    userId: string,
    vaultId: string,
    usage: CapacityUsage,
  ) {
    const rows: Array<{
      items: number | string;
      bytes: number | string;
      texts: number | string;
      videos: number | string;
    }> = await manager.query(
      `SELECT COUNT(*)::int AS "items",
         COALESCE(SUM(COALESCE(substring("encryptionKeyRef" from '"sizeBytes":([0-9]+)')::bigint, 0)), 0)::bigint AS "bytes",
         COUNT(*) FILTER (WHERE "type" = 'TEXT')::int AS "texts",
         COUNT(*) FILTER (WHERE "type" = 'VIDEO'
           OR "encryptionKeyRef" LIKE '%"contentKind":"VIDEO"%'
           OR "encryptionKeyRef" LIKE '%"mimeType":"video/%')::int AS "videos"
       FROM legacy_items
       WHERE "vaultId" = $1 AND "status" <> 'ARCHIVED'`,
      [vaultId],
    );
    const current = rows[0] ?? { items: 0, bytes: 0, texts: 0, videos: 0 };
    const maxItems = positiveSetting(process.env.VAULT_MAX_ITEMS, 500);
    const maxBytes =
      positiveSetting(process.env.VAULT_STORAGE_QUOTA_MB, 1024) * 1024 * 1024;
    if (Number(current.items) >= maxItems)
      throw new ForbiddenException({
        statusCode: 403,
        code: 'VAULT_ITEM_LIMIT_REACHED',
        message: `Your vault can hold up to ${maxItems} items. Remove an item before adding another.`,
      });
    if (Number(current.bytes) + usage.bytes > maxBytes)
      throw new ForbiddenException({
        statusCode: 403,
        code: 'VAULT_STORAGE_LIMIT_REACHED',
        message: `Your vault storage limit of ${Math.round(maxBytes / 1024 / 1024)} MB has been reached.`,
      });
    if (!this.planEntitlementService) return;
    if (usage.isText)
      await this.planEntitlementService.assertWithinLimit(
        userId,
        PlanLimit.PERSONAL_MESSAGES,
        Number(current.texts),
      );
    if (usage.isVideo)
      await this.planEntitlementService.assertWithinLimit(
        userId,
        PlanLimit.VIDEO_MESSAGES,
        Number(current.videos),
      );
  }

  /** Detects common video containers so a relabelled video still counts as video. */
  private looksLikeVideo(buffer: Buffer) {
    if (buffer.length < 12) return false;
    if (buffer.readUInt32BE(0) === 0x1a45dfa3) return true; // WebM / Matroska
    if (
      buffer.toString('latin1', 0, 4) === 'RIFF' &&
      buffer.toString('latin1', 8, 12) === 'AVI '
    )
      return true;
    if (buffer.toString('latin1', 4, 8) === 'ftyp')
      return !NON_VIDEO_BRANDS.has(buffer.toString('latin1', 8, 12));
    return false;
  }

  private sealTitle(title: string) {
    return (
      SEALED_TITLE_PREFIX +
      Buffer.from(JSON.stringify(this.encryptInline(title)), 'utf8').toString(
        'base64',
      )
    );
  }

  private openTitle(stored: string) {
    if (!stored?.startsWith(SEALED_TITLE_PREFIX)) return stored;
    try {
      const envelope = JSON.parse(
        Buffer.from(
          stored.slice(SEALED_TITLE_PREFIX.length),
          'base64',
        ).toString('utf8'),
      ) as StoredEnvelope;
      return this.decryptInline(envelope, null);
    } catch {
      throw new BadRequestException('Invalid encrypted item title.');
    }
  }

  private withPlainTitle<T extends LegacyItem>(item: T): T {
    return { ...item, title: this.openTitle(item.title) };
  }

  async assign(userId: string, itemId: string, dto: AssignItemDto) {
    const vault = await this.vaultService.getUserVault(userId);
    // Verify before locking so a slow identity check does not hold the row.
    const reauthenticated =
      (dto.currentPassword || dto.googleIdToken) && this.reauthService
        ? await this.reauthService
            .verify(userId, {
              currentPassword: dto.currentPassword,
              googleIdToken: dto.googleIdToken,
            })
            .then(() => true)
        : false;
    return this.itemRepository.manager.transaction(async (manager) => {
      const items = manager.getRepository(LegacyItem);
      const item = await items.findOne({
        where: {
          id: itemId,
          vaultId: vault.id,
          status: LegacyItemStatus.ACTIVE,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Item not found.');
      const previousRecipientId = item.assignment?.recipientId ?? null;
      if (item.assignment) {
        if (
          item.assignment.recipientId === dto.recipientId &&
          item.assignment.policyId === dto.policyId &&
          item.assignment.policyVersion === dto.policyVersion
        )
          return this.withPlainTitle(item);
        // Redirecting an item to someone else is the most sensitive vault
        // change, so it needs proof beyond the bearer token.
        if (!reauthenticated)
          throw new ForbiddenException({
            statusCode: 403,
            code: 'REAUTH_REQUIRED',
            message:
              'Confirm your identity to change who receives this item. Your saved assignment is unchanged.',
          });
      }
      const recipient = await manager.getRepository(Recipient).findOne({
        where: { id: dto.recipientId, userId },
        lock: { mode: 'pessimistic_read' },
      });
      const policy = await manager.getRepository(ReleasePolicy).findOne({
        where: { id: dto.policyId, userId, enabled: true },
        lock: { mode: 'pessimistic_read' },
      });
      if (!recipient || recipient.status === RecipientStatus.REVOKED)
        throw new BadRequestException('Choose an available recipient.');
      if (!policy || policy.version !== dto.policyVersion)
        throw new BadRequestException(
          'The policy has changed. Reload and review it before assigning.',
        );
      item.assignment = {
        recipientId: recipient.id,
        policyId: policy.id,
        policyVersion: policy.version,
        verificationRequired: policy.verificationRequired,
        trigger: policy.trigger,
        verificationLevel: policy.verificationLevel,
        escalationConfig: structuredClone(policy.escalationConfig),
        assignedAt: new Date().toISOString(),
      };
      const saved = await items.save(item);
      await manager.getRepository(AuditEvent).save({
        actorId: userId,
        action: 'release_policy_assigned',
        targetType: 'legacy_item',
        targetId: item.id,
        result: AuditResult.SUCCESS,
        metadata: {
          policyId: policy.id,
          policyVersion: policy.version,
          replacedRecipientId: previousRecipientId,
        },
      });
      return this.withPlainTitle(saved);
    });
  }

  async findAll(userId: string) {
    const vault = await this.vaultService.getUserVault(userId);

    const items = await this.itemRepository.find({
      where: {
        vaultId: vault.id,
        status: LegacyItemStatus.ACTIVE,
      },

      order: {
        updatedAt: 'DESC',
      },
    });
    return items.map((item) => this.withPlainTitle(item));
  }

  async findOne(userId: string, itemId: string) {
    const item = await this.loadOwnedItem(userId, itemId);
    return this.ownerDetail(item);
  }

  private async loadOwnedItem(userId: string, itemId: string) {
    const vault = await this.vaultService.getUserVault(userId);
    return this.loadItem(this.itemRepository, vault.id, itemId);
  }

  private async loadItem(
    repository: Repository<LegacyItem>,
    vaultId: string,
    itemId: string,
    lock = false,
  ) {
    const query = repository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
        'item.payloadStorageType',
      ])
      .where('item.id = :itemId AND item.vaultId = :vaultId', {
        itemId,
        vaultId,
      });
    if (lock) query.setLock('pessimistic_write');
    const item = await query.getOne();
    if (!item) throw new NotFoundException('Legacy item not found');
    return item;
  }

  private keyRef(item: LegacyItem): ItemKeyRef {
    if (!item.encryptionKeyRef) return {} as ItemKeyRef;
    try {
      const value: unknown = JSON.parse(item.encryptionKeyRef);
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error();
      return value as ItemKeyRef;
    } catch {
      throw new BadRequestException(
        'Invalid encryption metadata on vault item.',
      );
    }
  }

  private storageType(
    item: LegacyItem,
    keyRef = this.keyRef(item),
  ): PayloadStorageType {
    if (item.payloadStorageType) return item.payloadStorageType;
    if (keyRef.storageType) return keyRef.storageType;
    if (
      item.ciphertextRef?.startsWith('vaults/') ||
      item.ciphertextRef?.startsWith('s3://')
    )
      return 'S3';
    // Older inline records have a data-key envelope but no file metadata.
    if (
      !item.ciphertextRef ||
      (!keyRef.mimeType && !keyRef.storageKey && keyRef.encryptedDataKey)
    )
      return 'INLINE_DB';
    return 'LOCAL';
  }

  private encryptInline(value: string): StoredEnvelope {
    const encrypted = this.encryptionService.encrypt(
      Buffer.from(value, 'utf8'),
    );
    return {
      ...encrypted,
      ciphertext: encrypted.ciphertext.toString('base64'),
    };
  }

  private decryptEnvelope(
    envelope: StoredEnvelope,
    ciphertext: Buffer,
    fallbackVersion: string | null,
  ): Buffer {
    return this.encryptionService.decrypt({
      ...envelope,
      ciphertext,
      keyVersion: envelope.keyVersion || fallbackVersion || 'v1',
    });
  }

  private decryptInline(
    envelope: StoredEnvelope,
    fallbackVersion: string | null,
  ): string {
    if (typeof envelope.ciphertext !== 'string')
      throw new BadRequestException('Invalid encrypted item details.');
    return this.decryptEnvelope(
      envelope,
      Buffer.from(envelope.ciphertext, 'base64'),
      fallbackVersion,
    ).toString('utf8');
  }

  private safeFileName(value: string): string {
    return (
      value
        .replace(/\\/g, '/')
        .split('/')
        .pop()!
        .split('')
        .filter(
          (character) =>
            character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
        )
        .join('')
        .slice(0, 255) || 'vault-file'
    );
  }

  private safeMimeType(value?: string): string {
    const mimeType = value?.toLowerCase();
    return mimeType && ALLOWED_MIME_TYPES.some((type) => type.test(mimeType))
      ? mimeType
      : 'application/octet-stream';
  }

  private ownerDetail(item: LegacyItem) {
    const keyRef = this.keyRef(item);
    const storageType = this.storageType(item, keyRef);
    let description = item.description;
    if (
      storageType === 'INLINE_DB' &&
      item.ciphertextRef !== null &&
      item.ciphertextRef !== undefined &&
      item.encryptionKeyRef
    ) {
      description = this.decryptEnvelope(
        keyRef,
        Buffer.from(item.ciphertextRef, 'base64'),
        item.encryptionKeyVersion,
      ).toString('utf8');
    } else if (keyRef.description) {
      description = this.decryptInline(
        keyRef.description,
        item.encryptionKeyVersion,
      );
    }
    const hasFile = storageType !== 'INLINE_DB' && Boolean(item.ciphertextRef);
    const title = this.openTitle(item.title);
    let fileName: string | null = hasFile ? this.safeFileName(title) : null;
    if (hasFile && keyRef.fileMetadata) {
      const metadata: unknown = JSON.parse(
        this.decryptInline(keyRef.fileMetadata, item.encryptionKeyVersion),
      );
      if (
        metadata &&
        typeof metadata === 'object' &&
        typeof (metadata as { fileName?: unknown }).fileName === 'string'
      ) {
        fileName = this.safeFileName(
          (metadata as { fileName: string }).fileName,
        );
      }
    }
    return {
      id: item.id,
      vaultId: item.vaultId,
      type: item.type,
      category: item.category,
      title,
      description: description ?? null,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      assignment: item.assignment,
      hasFile,
      fileName,
      mimeType: hasFile ? this.safeMimeType(keyRef.mimeType) : null,
      sizeBytes: hasFile ? (keyRef.sizeBytes ?? null) : null,
    };
  }

  async update(userId: string, itemId: string, dto: UpdateLegacyItemDto) {
    if (dto.title === undefined && dto.description === undefined)
      throw new BadRequestException('Choose a title or description to update.');
    if (dto.title !== undefined && !dto.title.trim())
      throw new BadRequestException('A title is required.');
    const vault = await this.vaultService.getUserVault(userId);
    return this.itemRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(LegacyItem);
      const item = await this.loadItem(repository, vault.id, itemId, true);
      const keyRef = this.keyRef(item);
      item.payloadStorageType = this.storageType(item, keyRef);
      if (dto.title !== undefined)
        item.title = this.sealTitle(dto.title.trim());
      if (dto.description !== undefined) {
        if (item.payloadStorageType === 'INLINE_DB') {
          const encrypted = this.encryptInline(dto.description);
          item.ciphertextRef = encrypted.ciphertext!;
          item.encryptionKeyVersion = encrypted.keyVersion || 'v1';
          item.encryptionKeyRef = JSON.stringify({
            ...encrypted,
            ciphertext: undefined,
            storageType: 'INLINE_DB',
          });
        } else {
          keyRef.description = this.encryptInline(dto.description);
          item.encryptionKeyRef = JSON.stringify(keyRef);
        }
        item.description = null;
      }
      // Do not alter status, file bytes, original request hash or release assignments.
      await repository.save(item);
      return this.ownerDetail(item);
    });
  }

  /**
   * Securely retrieve and decrypt an item's file payload (from S3 or local storage).
   * Verified by AES-256-GCM authTag and SHA-256 checksum.
   */
  async downloadFile(userId: string, itemId: string) {
    const item = await this.loadOwnedItem(userId, itemId);
    const keyRef = this.keyRef(item);
    const storageType = this.storageType(item, keyRef);
    if (
      storageType === 'INLINE_DB' ||
      !item.ciphertextRef ||
      !item.encryptionKeyRef
    ) {
      throw new BadRequestException(
        'This vault item does not contain an uploaded file.',
      );
    }

    const ciphertext = await this.storageService.readVaultItemCiphertext(
      item.ciphertextRef,
    );

    const decrypted = this.decryptEnvelope(
      keyRef,
      ciphertext,
      item.encryptionKeyVersion,
    );
    const detail = this.ownerDetail(item);

    return {
      buffer: decrypted,
      mimeType: detail.mimeType!,
      filename: detail.fileName!,
      sizeBytes: decrypted.length,
      storageType,
    };
  }

  /**
   * Sync/Upload all items in the user's vault to AWS S3:
   * 1. Existing local files are encrypted and migrated directly to S3 with SHA-256 integrity verification.
   * 2. Items already in S3 are verified.
   * 3. Text/financial metadata items have secure encrypted snapshots backed up to S3.
   */
  async syncAllVaultItemsToS3(userId: string) {
    const vault = await this.vaultService.getUserVault(userId);

    if (!this.storageService.isS3Enabled()) {
      throw new BadRequestException(
        'AWS S3 is not configured. Set AWS_S3_BUCKET_NAME and an AWS credential provider or a complete access key pair.',
      );
    }

    const items = await this.itemRepository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
        'item.payloadStorageType',
      ])
      .where('item.vaultId = :vaultId', { vaultId: vault.id })
      .getMany();

    const results: Array<{
      itemId: string;
      title: string;
      type: string;
      action: 'MIGRATED_TO_S3' | 'ALREADY_ON_S3' | 'BACKED_UP_TO_S3';
      s3Key: string;
      s3Uri?: string;
      checksumSha256?: string;
    }> = [];

    for (const item of items) {
      const keyRef = this.keyRef(item);
      const storageType = this.storageType(item, keyRef);
      if (
        storageType !== 'INLINE_DB' &&
        item.ciphertextRef &&
        item.encryptionKeyRef
      ) {
        // Check if already in S3
        if (storageType === 'S3') {
          const ciphertext = await this.storageService.readVaultItemCiphertext(
            item.ciphertextRef,
          );
          this.decryptEnvelope(keyRef, ciphertext, item.encryptionKeyVersion);
          results.push({
            itemId: item.id,
            title: this.openTitle(item.title),
            type: item.type,
            action: 'ALREADY_ON_S3',
            s3Key: item.ciphertextRef,
            s3Uri: keyRef.s3Uri,
            checksumSha256: keyRef.checksumSha256,
          });
          continue;
        }

        // Reload under the same lock used by edits so a migration cannot
        // overwrite a description changed after the initial list query.
        const migrated = await this.itemRepository.manager.transaction(
          async (manager) => {
            const repository = manager.getRepository(LegacyItem);
            const current = await this.loadItem(
              repository,
              vault.id,
              item.id,
              true,
            );
            const currentRef = this.keyRef(current);
            const currentStorage = this.storageType(current, currentRef);
            if (currentStorage !== 'LOCAL' && currentStorage !== 'S3')
              throw new ConflictException(
                'This item no longer has a local file.',
              );
            const ciphertext =
              await this.storageService.readVaultItemCiphertext(
                current.ciphertextRef!,
              );
            this.decryptEnvelope(
              currentRef,
              ciphertext,
              current.encryptionKeyVersion,
            );
            if (currentStorage === 'S3') {
              return {
                itemId: current.id,
                title: this.openTitle(current.title),
                type: current.type,
                action: 'ALREADY_ON_S3' as const,
                s3Key: current.ciphertextRef!,
                s3Uri: currentRef.s3Uri,
                checksumSha256: currentRef.checksumSha256,
              };
            }
            const migration = await this.storageService.migrateLocalFileToS3({
              vaultId: vault.id,
              itemId: current.id,
              localFileName: current.ciphertextRef!,
              mimeType: currentRef.mimeType,
              metadata: { itemType: current.type },
            });
            current.ciphertextRef = migration.storageKey;
            current.payloadStorageType = 'S3';
            currentRef.storageType = 'S3';
            currentRef.storageKey = migration.storageKey;
            currentRef.s3Uri = migration.s3Uri;
            currentRef.checksumSha256 = migration.checksumSha256;
            currentRef.sizeBytes = migration.sizeBytes;
            current.encryptionKeyRef = JSON.stringify(currentRef);
            await repository.save(current);
            return {
              itemId: current.id,
              title: this.openTitle(current.title),
              type: current.type,
              action: 'MIGRATED_TO_S3' as const,
              s3Key: migration.storageKey,
              s3Uri: migration.s3Uri,
              checksumSha256: migration.checksumSha256,
            };
          },
        );
        results.push(migrated);
      } else {
        // Encrypted snapshot backup to S3
        const itemSnapshot = Buffer.from(
          JSON.stringify({
            id: item.id,
            vaultId: item.vaultId,
            type: item.type,
            category: item.category,
            title: item.title,
            status: item.status,
            assignment: item.assignment,
            description: item.description,
            payloadStorageType: storageType,
            ciphertextRef: item.ciphertextRef,
            encryptionKeyRef: item.encryptionKeyRef,
            encryptionKeyVersion: item.encryptionKeyVersion,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }),
          'utf8',
        );

        const encryptedBackup = this.encryptionService.encrypt(itemSnapshot);
        // A completed sync must retain everything needed to unwrap its data key.
        this.encryptionService.decrypt(encryptedBackup);
        const backupResult = await this.storageService.backupItemPayloadToS3({
          vaultId: vault.id,
          itemId: item.id,
          // Keep recovery fields in the downloaded object itself: S3 metadata
          // lowercases field names and may be omitted during export/restore.
          encryptedPayload: Buffer.from(
            JSON.stringify({
              ...encryptedBackup,
              ciphertext: encryptedBackup.ciphertext.toString('base64'),
              formatVersion: 1,
            }),
            'utf8',
          ),
          itemType: item.type,
          metadata: {
            encryptedDataKey: encryptedBackup.encryptedDataKey,
            keyIv: encryptedBackup.keyIv,
            keyAuthTag: encryptedBackup.keyAuthTag,
            iv: encryptedBackup.iv,
            authTag: encryptedBackup.authTag,
            algorithm: encryptedBackup.algorithm,
            keyVersion: encryptedBackup.keyVersion,
            formatVersion: '1',
          },
        });

        results.push({
          itemId: item.id,
          title: this.openTitle(item.title),
          type: item.type,
          action: 'BACKED_UP_TO_S3',
          s3Key: backupResult.key,
          s3Uri: backupResult.s3Uri,
          checksumSha256: backupResult.checksumSha256,
        });
      }
    }

    return {
      success: true,
      vaultId: vault.id,
      totalItems: items.length,
      syncedItemsCount: results.length,
      s3Configured: true,
      // Storage keys and URIs stay server-side.
      items: results.map((result) => ({
        itemId: result.itemId,
        title: result.title,
        type: result.type,
        action: result.action,
        checksumSha256: result.checksumSha256,
      })),
    };
  }

  /**
   * Get S3 storage status and integrity info for a specific item.
   */
  async getItemS3Status(userId: string, itemId: string) {
    const fullItem = await this.loadOwnedItem(userId, itemId);
    const keyRef = this.keyRef(fullItem);
    const storageType = this.storageType(fullItem, keyRef);
    const isS3 = storageType === 'S3';

    return {
      itemId: fullItem.id,
      title: this.openTitle(fullItem.title),
      type: fullItem.type,
      storageType,
      s3Configured: this.storageService.isS3Enabled(),
      // Bucket keys and URIs are infrastructure details, not owner data.
      storedInS3: isS3,
      checksumSha256: keyRef.checksumSha256 || null,
      encryptionAlgorithm: keyRef.algorithm || 'aes-256-gcm',
      encryptionKeyVersion: fullItem.encryptionKeyVersion || 'v1',
    };
  }

  /**
   * Get an aggregated overview of S3 vault cloud storage:
   * Total items, items stored in S3, local items, configuration status, bucket and region.
   */
  async getVaultS3Overview(userId: string) {
    const vault = await this.vaultService.getUserVault(userId);
    const items = await this.itemRepository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
        'item.payloadStorageType',
      ])
      .where('item.vaultId = :vaultId', { vaultId: vault.id })
      .getMany();

    const s3Details = this.storageService.getS3Details();

    let s3Stored = 0;
    let localDisk = 0;
    let inlineEncrypted = 0;

    for (const item of items) {
      const storageType = this.storageType(item);
      if (storageType === 'S3') {
        s3Stored += 1;
      } else if (storageType === 'LOCAL') {
        localDisk += 1;
      } else {
        inlineEncrypted += 1;
      }
    }

    return {
      vaultId: vault.id,
      totalItems: items.length,
      s3Configured: s3Details.configured,
      encryption: 'AES-256-GCM Envelope + AWS S3 SSE',
      storageBreakdown: {
        s3Stored,
        localDisk,
        inlineEncrypted,
      },
      allSyncedToS3:
        s3Details.configured && items.length > 0 && s3Stored === items.length,
    };
  }
}
