import { AuditEvent, AuditResult } from '../audit/entities/audit-event.entity';
import { Recipient, RecipientStatus } from '../recipients/entities/recipient.entity';
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
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

@Injectable()
export class LegacyItemsService {
  constructor(
    @InjectRepository(LegacyItem)
    private readonly itemRepository: Repository<LegacyItem>,
    @InjectRepository(Recipient) private readonly recipients: Repository<Recipient>,
    @InjectRepository(ReleasePolicy) private readonly policies: Repository<ReleasePolicy>,

    private readonly vaultService: VaultService,

    private readonly encryptionService: EncryptionService,
  ) {}

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
    const vault =
      await this.vaultService.getUserVault(
        userId,
      );

    const encryptedDescription = data.description
      ? this.encryptionService.encrypt(
          Buffer.from(data.description, 'utf8'),
        )
      : null;

    const item =
      this.itemRepository.create({
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
              encryptedDataKey:
                encryptedDescription.encryptedDataKey,
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
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required.');
    }

    const vault = await this.vaultService.getUserVault(userId);
    const encryptedFile = this.encryptionService.encrypt(file.buffer);
    const storageDirectory = resolve(
      process.env.PRIVATE_STORAGE_DIR ?? 'storage',
    );
    const storageFileName = `${randomUUID()}.bin`;

    await mkdir(storageDirectory, { recursive: true });
    await writeFile(
      resolve(storageDirectory, storageFileName),
      encryptedFile.ciphertext,
      { mode: 0o600 },
    );

    const encryptedDescription = data.description
      ? this.encryptionService.encrypt(
          Buffer.from(data.description, 'utf8'),
        )
      : null;

    const item = this.itemRepository.create({
      vaultId: vault.id,
      requestKey: data.requestKey ?? null,
      requestHash: this.requestHash(data, file.buffer),
      type: data.type,
      category: data.category,
      title: data.title,
      description: null,
      ciphertextRef: storageFileName,
      encryptionKeyRef: JSON.stringify({
        encryptedDataKey: encryptedFile.encryptedDataKey,
        keyIv: encryptedFile.keyIv,
        keyAuthTag: encryptedFile.keyAuthTag,
        iv: encryptedFile.iv,
        authTag: encryptedFile.authTag,
        algorithm: encryptedFile.algorithm,
        mimeType: file.mimetype,
        description: encryptedDescription
          ? {
              ciphertext:
                encryptedDescription.ciphertext.toString('base64'),
              encryptedDataKey:
                encryptedDescription.encryptedDataKey,
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
      if (saved.ciphertextRef !== storageFileName) await unlink(resolve(storageDirectory, storageFileName));
      return saved;
    } catch (error) {
      await unlink(resolve(storageDirectory, storageFileName)).catch(() => undefined);
      throw error;
    }
  }

  private requestHash(data: { type: string; category: string; title: string; description?: string }, file?: Buffer) {
    const hash = createHash('sha256').update(JSON.stringify([data.type, data.category, data.title, data.description ?? '']));
    if (file) hash.update(file);
    return hash.digest('hex');
  }

  private async saveIdempotent(item: LegacyItem) {
    try { return await this.itemRepository.save(item); }
    catch (error) {
      if (!item.requestKey || (error as { code?: string }).code !== '23505') throw error;
      const saved = await this.itemRepository.createQueryBuilder('item')
        .addSelect(['item.requestHash', 'item.ciphertextRef'])
        .where('item.vaultId = :vaultId AND item.requestKey = :requestKey', { vaultId: item.vaultId, requestKey: item.requestKey })
        .getOne();
      if (!saved || saved.requestHash !== item.requestHash) throw new ConflictException('This request already saved different content. Start a new item to save changes.');
      return saved;
    }
  }

  async assign(userId: string, itemId: string, dto: AssignItemDto) {
    const vault = await this.vaultService.getUserVault(userId);
    return this.itemRepository.manager.transaction(async (manager) => {
      const items = manager.getRepository(LegacyItem);
      const item = await items.findOne({ where: { id: itemId, vaultId: vault.id, status: LegacyItemStatus.ACTIVE }, lock: { mode: 'pessimistic_write' } });
      if (!item) throw new NotFoundException('Item not found.');
      if (item.assignment) {
        if (item.assignment.recipientId === dto.recipientId && item.assignment.policyId === dto.policyId && item.assignment.policyVersion === dto.policyVersion) return item;
        throw new BadRequestException('Changing an existing assignment requires re-authentication, which is not available yet. Your saved assignment is unchanged.');
      }
      const recipient = await manager.getRepository(Recipient).findOne({ where: { id: dto.recipientId, userId }, lock: { mode: 'pessimistic_read' } });
      const policy = await manager.getRepository(ReleasePolicy).findOne({ where: { id: dto.policyId, userId, enabled: true }, lock: { mode: 'pessimistic_read' } });
      if (!recipient || recipient.status === RecipientStatus.REVOKED) throw new BadRequestException('Choose an available recipient.');
      if (!policy || policy.version !== dto.policyVersion) throw new BadRequestException('The policy has changed. Reload and review it before assigning.');
      item.assignment = {
        recipientId: recipient.id, policyId: policy.id, policyVersion: policy.version,
        verificationRequired: policy.verificationRequired, trigger: policy.trigger,
        verificationLevel: policy.verificationLevel,
        escalationConfig: structuredClone(policy.escalationConfig), assignedAt: new Date().toISOString(),
      };
      const saved = await items.save(item);
      await manager.getRepository(AuditEvent).save({ actorId: userId, action: 'release_policy_assigned', targetType: 'legacy_item', targetId: item.id, result: AuditResult.SUCCESS, metadata: { policyId: policy.id, policyVersion: policy.version } });
      return saved;
    });
  }

  async findAll(userId: string) {
    const vault =
      await this.vaultService.getUserVault(
        userId,
      );

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

  async findOne(
    userId: string,
    itemId: string,
  ) {
    const vault =
      await this.vaultService.getUserVault(
        userId,
      );

    const item =
      await this.itemRepository.findOne({
        where: {
          id: itemId,
          vaultId: vault.id,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Legacy item not found',
      );
    }

    return item;
  }
}
