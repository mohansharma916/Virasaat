import {
  BadRequestException,
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
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LegacyItemsService {
  constructor(
    @InjectRepository(LegacyItem)
    private readonly itemRepository: Repository<LegacyItem>,

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

    return this.itemRepository.save(item);
  }

  async createEncryptedUpload(
    userId: string,
    data: {
      type: LegacyItemType;
      category: string;
      title: string;
      description?: string;
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

    return this.itemRepository.save(item);
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
