import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { S3StorageService, S3UploadResult } from './s3-storage.service';
import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export interface StorageSaveResult {
  storageType: 'S3' | 'LOCAL';
  storageKey: string;
  checksumSha256: string;
  sizeBytes: number;
  s3Uri?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly s3StorageService: S3StorageService) {}

  /**
   * Check whether S3 is currently enabled and configured.
   */
  isS3Enabled(): boolean {
    return this.s3StorageService.isConfigured();
  }

  /**
   * Get public details of S3 configuration (bucket, region, status).
   */
  getS3Details(): { configured: boolean; bucketName: string; region: string } {
    return {
      configured: this.s3StorageService.isConfigured(),
      bucketName: this.s3StorageService.getBucketName(),
      region: this.s3StorageService.getRegion(),
    };
  }

  /**
   * Save encrypted vault item file:
   * Directly uploads to AWS S3.
   * If S3 is not configured or upload fails, throws an explicit exception immediately (no local fallback).
   */
  async saveVaultItemFile(params: {
    vaultId: string;
    itemId?: string;
    ciphertext: Buffer;
    mimeType?: string;
    metadata?: Record<string, string>;
  }): Promise<StorageSaveResult> {
    if (!this.s3StorageService.isConfigured()) {
      const errorMsg =
        'AWS S3 is not configured. Direct S3 storage is required for all vault items. Please check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in environment settings.';
      this.logger.error(errorMsg);
      throw new ServiceUnavailableException(errorMsg);
    }

    const fileId = randomUUID();
    const checksumSha256 = createHash('sha256')
      .update(params.ciphertext)
      .digest('hex');

    // Partitioned S3 object key: vaults/{vaultId}/items/{itemId || fileId}/{fileId}.bin
    const s3Key = `vaults/${params.vaultId}/items/${params.itemId || fileId}/${fileId}.bin`;

    try {
      const uploadResult =
        await this.s3StorageService.uploadEncryptedCiphertext({
          key: s3Key,
          ciphertext: params.ciphertext,
          contentType: params.mimeType || 'application/octet-stream',
          metadata: {
            'vault-id': params.vaultId,
            ...(params.itemId ? { 'item-id': params.itemId } : {}),
            'sha256-checksum': checksumSha256,
            ...(params.metadata || {}),
          },
        });

      this.logger.log(
        `Vault item file stored directly in S3: ${uploadResult.s3Uri} (size=${uploadResult.sizeBytes} bytes, checksum=${checksumSha256})`,
      );

      return {
        storageType: 'S3',
        storageKey: s3Key,
        checksumSha256,
        sizeBytes: params.ciphertext.length,
        s3Uri: uploadResult.s3Uri,
      };
    } catch (error: any) {
      const failureMsg = `Direct S3 upload failed for key '${s3Key}': ${error?.message || error}`;
      this.logger.error(failureMsg, error?.stack);
      throw new BadGatewayException(
        `AWS S3 Upload Failed: ${error?.message || 'Unable to store file in AWS S3. Please verify bucket permissions.'}`,
      );
    }
  }

  /**
   * Retrieve encrypted ciphertext by its reference (S3 key or local filename).
   */
  async readVaultItemCiphertext(ciphertextRef: string): Promise<Buffer> {
    if (!ciphertextRef) {
      throw new Error('Ciphertext reference is empty.');
    }

    // Check if stored in S3 (e.g. starts with 'vaults/' or 's3://')
    if (this.isS3Key(ciphertextRef)) {
      const cleanKey = this.extractS3Key(ciphertextRef);
      try {
        const s3Result =
          await this.s3StorageService.downloadEncryptedCiphertext(cleanKey);
        return s3Result.ciphertext;
      } catch (error: any) {
        throw new BadGatewayException(
          `Failed to retrieve document from AWS S3: ${error?.message || 'S3 download failed'}`,
        );
      }
    }

    // Otherwise, retrieve from local storage directory
    const storageDirectory = resolve(
      process.env.PRIVATE_STORAGE_DIR ?? 'storage',
    );
    return readFile(resolve(storageDirectory, ciphertextRef));
  }

  /**
   * Delete a stored vault item file (S3 or local).
   */
  async deleteVaultItemFile(ciphertextRef: string): Promise<void> {
    if (!ciphertextRef) return;

    if (this.isS3Key(ciphertextRef)) {
      const cleanKey = this.extractS3Key(ciphertextRef);
      await this.s3StorageService.deleteObject(cleanKey);
      return;
    }

    const storageDirectory = resolve(
      process.env.PRIVATE_STORAGE_DIR ?? 'storage',
    );
    await unlink(resolve(storageDirectory, ciphertextRef)).catch(
      () => undefined,
    );
  }

  /**
   * Migrate a local file to S3.
   */
  async migrateLocalFileToS3(params: {
    vaultId: string;
    itemId: string;
    localFileName: string;
    mimeType?: string;
    metadata?: Record<string, string>;
  }): Promise<StorageSaveResult> {
    if (!this.s3StorageService.isConfigured()) {
      throw new Error(
        'Cannot migrate to S3: AWS S3 credentials or bucket are not configured.',
      );
    }

    const storageDirectory = resolve(
      process.env.PRIVATE_STORAGE_DIR ?? 'storage',
    );
    const localPath = resolve(storageDirectory, params.localFileName);
    const ciphertext = await readFile(localPath);

    const s3Key = `vaults/${params.vaultId}/items/${params.itemId}/${randomUUID()}.bin`;
    const checksumSha256 = createHash('sha256')
      .update(ciphertext)
      .digest('hex');

    const uploadResult = await this.s3StorageService.uploadEncryptedCiphertext({
      key: s3Key,
      ciphertext,
      contentType: params.mimeType || 'application/octet-stream',
      metadata: {
        'vault-id': params.vaultId,
        'item-id': params.itemId,
        'migrated-from-local': params.localFileName,
        'sha256-checksum': checksumSha256,
        ...(params.metadata || {}),
      },
    });

    this.logger.log(
      `Migrated local vault item ${params.localFileName} to S3: ${uploadResult.s3Uri}`,
    );

    return {
      storageType: 'S3',
      storageKey: s3Key,
      checksumSha256,
      sizeBytes: ciphertext.length,
      s3Uri: uploadResult.s3Uri,
    };
  }

  /**
   * Upload an encrypted payload/backup of any vault item to S3.
   */
  async backupItemPayloadToS3(params: {
    vaultId: string;
    itemId: string;
    encryptedPayload: Buffer;
    itemType: string;
    metadata?: Record<string, string>;
  }): Promise<S3UploadResult> {
    if (!this.s3StorageService.isConfigured()) {
      throw new Error(
        'Cannot backup to S3: AWS S3 credentials or bucket are not configured.',
      );
    }

    const s3Key = `vaults/${params.vaultId}/items/${params.itemId}/backup.enc`;

    return this.s3StorageService.uploadEncryptedCiphertext({
      key: s3Key,
      ciphertext: params.encryptedPayload,
      contentType: 'application/octet-stream',
      metadata: {
        'vault-id': params.vaultId,
        'item-id': params.itemId,
        'item-type': params.itemType,
        ...(params.metadata || {}),
      },
    });
  }

  private isS3Key(ref: string): boolean {
    return ref.startsWith('vaults/') || ref.startsWith('s3://');
  }

  private extractS3Key(ref: string): string {
    if (ref.startsWith('s3://')) {
      const withoutPrefix = ref.slice(5);
      const firstSlash = withoutPrefix.indexOf('/');
      return firstSlash !== -1
        ? withoutPrefix.slice(firstSlash + 1)
        : withoutPrefix;
    }
    return ref;
  }
}
