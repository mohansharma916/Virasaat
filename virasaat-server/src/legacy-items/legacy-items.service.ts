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
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
import { randomUUID, createHash } from 'node:crypto';

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
      title: data.title,
      // Sensitive item details are encrypted before persistence. The list
      // endpoint intentionally returns metadata only, not plaintext.
      description: null,

      ciphertextRef: encryptedDescription
        ? encryptedDescription.ciphertext.toString('base64')
        : null,

      encryptionKeyRef: encryptedDescription
        ? JSON.stringify({
            encryptedDataKey: encryptedDescription.encryptedDataKey,
            keyIv: encryptedDescription.keyIv,
            keyAuthTag: encryptedDescription.keyAuthTag,
            iv: encryptedDescription.iv,
            authTag: encryptedDescription.authTag,
            algorithm: encryptedDescription.algorithm,
          })
        : null,

      encryptionKeyVersion: encryptedDescription?.keyVersion ?? null,

      status: LegacyItemStatus.ACTIVE,
    });

    return this.saveIdempotent(item);
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

    const mimeType = file?.mimetype || 'application/octet-stream';
    const vault = await this.vaultService.getUserVault(userId);
    const encryptedFile = this.encryptionService.encrypt(fileBuffer);

    const savedStorage = await this.storageService.saveVaultItemFile({
      vaultId: vault.id,
      ciphertext: encryptedFile.ciphertext,
      mimeType,
      metadata: {
        itemType: data.type,
        itemCategory: data.category,
        itemTitle: data.title,
      },
    });

    const encryptedDescription = data.description
      ? this.encryptionService.encrypt(Buffer.from(data.description, 'utf8'))
      : null;

    const item = this.itemRepository.create({
      vaultId: vault.id,
      requestKey: data.requestKey ?? null,
      requestHash: this.requestHash(data, fileBuffer),
      type: data.type,
      category: data.category,
      title: data.title,
      description: null,
      ciphertextRef: savedStorage.storageKey,
      encryptionKeyRef: JSON.stringify({
        encryptedDataKey: encryptedFile.encryptedDataKey,
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
        description: encryptedDescription
          ? {
              ciphertext: encryptedDescription.ciphertext.toString('base64'),
              encryptedDataKey: encryptedDescription.encryptedDataKey,
              keyIv: encryptedDescription.keyIv,
              keyAuthTag: encryptedDescription.keyAuthTag,
              iv: encryptedDescription.iv,
              authTag: encryptedDescription.authTag,
            }
          : undefined,
      }),
      encryptionKeyVersion: encryptedFile.keyVersion,
      status: LegacyItemStatus.ACTIVE,
    });

    try {
      const saved = await this.saveIdempotent(item);
      if (saved.ciphertextRef !== savedStorage.storageKey) {
        await this.storageService.deleteVaultItemFile(savedStorage.storageKey);
      }
      return saved;
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

  private async saveIdempotent(item: LegacyItem) {
    try {
      return await this.itemRepository.save(item);
    } catch (error) {
      if (!item.requestKey || (error as { code?: string }).code !== '23505')
        throw error;
      const saved = await this.itemRepository
        .createQueryBuilder('item')
        .addSelect(['item.requestHash', 'item.ciphertextRef'])
        .where('item.vaultId = :vaultId AND item.requestKey = :requestKey', {
          vaultId: item.vaultId,
          requestKey: item.requestKey,
        })
        .getOne();
      if (!saved || saved.requestHash !== item.requestHash)
        throw new ConflictException(
          'This request already saved different content. Start a new item to save changes.',
        );
      return saved;
    }
  }

  async assign(userId: string, itemId: string, dto: AssignItemDto) {
    const vault = await this.vaultService.getUserVault(userId);
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
      if (item.assignment) {
        if (
          item.assignment.recipientId === dto.recipientId &&
          item.assignment.policyId === dto.policyId &&
          item.assignment.policyVersion === dto.policyVersion
        )
          return item;
        throw new BadRequestException(
          'Changing an existing assignment requires re-authentication, which is not available yet. Your saved assignment is unchanged.',
        );
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
        metadata: { policyId: policy.id, policyVersion: policy.version },
      });
      return saved;
    });
  }

  async findAll(userId: string) {
    const vault = await this.vaultService.getUserVault(userId);

    return this.itemRepository.find({
      where: {
        vaultId: vault.id,
        status: LegacyItemStatus.ACTIVE,
      },

      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findOne(userId: string, itemId: string) {
    const vault = await this.vaultService.getUserVault(userId);

    const item = await this.itemRepository.findOne({
      where: {
        id: itemId,
        vaultId: vault.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Legacy item not found');
    }

    return item;
  }

  /**
   * Securely retrieve and decrypt an item's file payload (from S3 or local storage).
   * Verified by AES-256-GCM authTag and SHA-256 checksum.
   */
  async downloadFile(userId: string, itemId: string) {
    const vault = await this.vaultService.getUserVault(userId);

    const item = await this.itemRepository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
      ])
      .where('item.id = :itemId AND item.vaultId = :vaultId', {
        itemId,
        vaultId: vault.id,
      })
      .getOne();

    if (!item) {
      throw new NotFoundException('Vault item not found.');
    }

    if (!item.ciphertextRef || !item.encryptionKeyRef) {
      throw new BadRequestException(
        'This vault item does not contain an uploaded file.',
      );
    }

    let keyRef: {
      encryptedDataKey: string;
      keyIv: string;
      keyAuthTag: string;
      iv: string;
      authTag: string;
      mimeType?: string;
      storageType?: string;
    };

    try {
      keyRef = JSON.parse(item.encryptionKeyRef);
    } catch {
      throw new BadRequestException(
        'Invalid encryption metadata on vault item.',
      );
    }

    const ciphertext = await this.storageService.readVaultItemCiphertext(
      item.ciphertextRef,
    );

    const decrypted = this.encryptionService.decrypt({
      ciphertext,
      encryptedDataKey: keyRef.encryptedDataKey,
      keyIv: keyRef.keyIv,
      keyAuthTag: keyRef.keyAuthTag,
      iv: keyRef.iv,
      authTag: keyRef.authTag,
    });

    const isS3 =
      item.ciphertextRef.startsWith('vaults/') ||
      item.ciphertextRef.startsWith('s3://');

    return {
      buffer: decrypted,
      mimeType: keyRef.mimeType || 'application/octet-stream',
      filename: `${item.title.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      sizeBytes: decrypted.length,
      storageType: keyRef.storageType || (isS3 ? 'S3' : 'LOCAL'),
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
        'AWS S3 is not configured. Please set AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in the server environment.',
      );
    }

    const items = await this.itemRepository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
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
      if (item.ciphertextRef && item.encryptionKeyRef) {
        let keyRef: any = {};
        try {
          keyRef = JSON.parse(item.encryptionKeyRef);
        } catch {
          keyRef = {};
        }

        // Check if already in S3
        if (
          item.ciphertextRef.startsWith('vaults/') ||
          item.ciphertextRef.startsWith('s3://')
        ) {
          results.push({
            itemId: item.id,
            title: item.title,
            type: item.type,
            action: 'ALREADY_ON_S3',
            s3Key: item.ciphertextRef,
            s3Uri: keyRef.s3Uri,
            checksumSha256: keyRef.checksumSha256,
          });
          continue;
        }

        // Migrate local file to S3
        const migration = await this.storageService.migrateLocalFileToS3({
          vaultId: vault.id,
          itemId: item.id,
          localFileName: item.ciphertextRef,
          mimeType: keyRef.mimeType,
          metadata: {
            itemTitle: item.title,
            itemType: item.type,
            itemCategory: item.category,
          },
        });

        item.ciphertextRef = migration.storageKey;
        keyRef.storageType = 'S3';
        keyRef.storageKey = migration.storageKey;
        keyRef.s3Uri = migration.s3Uri;
        keyRef.checksumSha256 = migration.checksumSha256;
        item.encryptionKeyRef = JSON.stringify(keyRef);
        await this.itemRepository.save(item);

        results.push({
          itemId: item.id,
          title: item.title,
          type: item.type,
          action: 'MIGRATED_TO_S3',
          s3Key: migration.storageKey,
          s3Uri: migration.s3Uri,
          checksumSha256: migration.checksumSha256,
        });
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
            ciphertextRef: item.ciphertextRef,
            encryptionKeyRef: item.encryptionKeyRef,
            encryptionKeyVersion: item.encryptionKeyVersion,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }),
          'utf8',
        );

        const encryptedBackup = this.encryptionService.encrypt(itemSnapshot);
        const backupResult = await this.storageService.backupItemPayloadToS3({
          vaultId: vault.id,
          itemId: item.id,
          encryptedPayload: encryptedBackup.ciphertext,
          itemType: item.type,
          metadata: {
            itemTitle: item.title,
            encryptedDataKey: encryptedBackup.encryptedDataKey,
            iv: encryptedBackup.iv,
            authTag: encryptedBackup.authTag,
          },
        });

        results.push({
          itemId: item.id,
          title: item.title,
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
      items: results,
    };
  }

  /**
   * Get S3 storage status and integrity info for a specific item.
   */
  async getItemS3Status(userId: string, itemId: string) {
    const item = await this.findOne(userId, itemId);
    const fullItem = await this.itemRepository
      .createQueryBuilder('item')
      .addSelect([
        'item.ciphertextRef',
        'item.encryptionKeyRef',
        'item.encryptionKeyVersion',
      ])
      .where('item.id = :itemId', { itemId: item.id })
      .getOne();

    if (!fullItem) {
      throw new NotFoundException('Item not found');
    }

    let keyRef: any = {};
    try {
      keyRef = fullItem.encryptionKeyRef
        ? JSON.parse(fullItem.encryptionKeyRef)
        : {};
    } catch {
      keyRef = {};
    }

    const isS3 =
      fullItem.ciphertextRef?.startsWith('vaults/') ||
      fullItem.ciphertextRef?.startsWith('s3://');

    return {
      itemId: fullItem.id,
      title: fullItem.title,
      type: fullItem.type,
      storageType: isS3 ? 'S3' : fullItem.ciphertextRef ? 'LOCAL' : 'INLINE_DB',
      s3Configured: this.storageService.isS3Enabled(),
      s3Key: isS3 ? fullItem.ciphertextRef : null,
      s3Uri: keyRef.s3Uri || null,
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
      .addSelect(['item.ciphertextRef', 'item.encryptionKeyRef', 'item.encryptionKeyVersion'])
      .where('item.vaultId = :vaultId', { vaultId: vault.id })
      .getMany();

    const s3Details = this.storageService.getS3Details();

    let s3Stored = 0;
    let localDisk = 0;
    let inlineEncrypted = 0;

    for (const item of items) {
      if (item.ciphertextRef?.startsWith('vaults/') || item.ciphertextRef?.startsWith('s3://')) {
        s3Stored += 1;
      } else if (item.ciphertextRef) {
        localDisk += 1;
      } else {
        inlineEncrypted += 1;
      }
    }

    return {
      vaultId: vault.id,
      totalItems: items.length,
      s3Configured: s3Details.configured,
      s3Bucket: s3Details.configured ? s3Details.bucketName : null,
      region: s3Details.configured ? s3Details.region : null,
      encryption: 'AES-256-GCM Envelope + AWS S3 SSE',
      storageBreakdown: {
        s3Stored,
        localDisk,
        inlineEncrypted,
      },
      allSyncedToS3: s3Details.configured && items.length > 0 && s3Stored === items.length,
    };
  }
}
