import { Injectable, Logger, Optional } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

export interface S3UploadResult {
  key: string;
  bucket: string;
  s3Uri: string;
  checksumSha256: string;
  sizeBytes: number;
  serverSideEncryption?: string;
  kmsKeyId?: string;
}

export interface S3DownloadResult {
  key: string;
  ciphertext: Buffer;
  contentType?: string;
  metadata: Record<string, string>;
  checksumVerified: boolean;
}

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly kmsKeyId?: string;
  private readonly configured: boolean = false;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.region =
      this.configService?.get<string>('AWS_REGION') ||
      process.env.AWS_REGION ||
      'ap-south-1';

    this.bucketName =
      this.configService?.get<string>('AWS_S3_BUCKET_NAME') ||
      this.configService?.get<string>('AWS_S3_BUCKET') ||
      process.env.AWS_S3_BUCKET_NAME ||
      process.env.AWS_S3_BUCKET ||
      '';

    const accessKeyId =
      this.configService?.get<string>('AWS_ACCESS_KEY_ID') ||
      process.env.AWS_ACCESS_KEY_ID;

    const secretAccessKey =
      this.configService?.get<string>('AWS_SECRET_ACCESS_KEY') ||
      process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken =
      this.configService?.get<string>('AWS_SESSION_TOKEN') ||
      process.env.AWS_SESSION_TOKEN;

    const endpoint =
      this.configService?.get<string>('AWS_S3_ENDPOINT') ||
      process.env.AWS_S3_ENDPOINT;

    const forcePathStyle =
      (this.configService?.get<string>('AWS_S3_FORCE_PATH_STYLE') ||
        process.env.AWS_S3_FORCE_PATH_STYLE) === 'true';

    this.kmsKeyId =
      this.configService?.get<string>('AWS_S3_KMS_KEY_ID') ||
      process.env.AWS_S3_KMS_KEY_ID;

    if (this.bucketName) {
      if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
        throw new Error(
          'Configure both AWS access key fields, or use the AWS credential provider chain.',
        );
      }
      this.s3Client = new S3Client({
        region: this.region,
        ...(accessKeyId && secretAccessKey
          ? {
              credentials: {
                accessKeyId,
                secretAccessKey,
                ...(sessionToken ? { sessionToken } : {}),
              },
            }
          : {}),
        ...(endpoint ? { endpoint, forcePathStyle } : {}),
      });
      this.configured = true;
      this.logger.log(
        `S3StorageService initialized: bucket=${this.bucketName}, region=${this.region}, endpoint=${endpoint || 'aws-default'}, kms=${this.kmsKeyId ? 'configured' : 'AES256'}`,
      );
    } else {
      this.logger.warn(
        'S3StorageService: S3 bucket is not configured. New vault file uploads are unavailable until S3 is configured.',
      );
    }
  }

  /**
   * Whether AWS S3 is properly configured with credentials and bucket.
   */
  isConfigured(): boolean {
    return (
      this.configured && this.s3Client !== null && Boolean(this.bucketName)
    );
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getRegion(): string {
    return this.region;
  }

  /**
   * Upload encrypted ciphertext to AWS S3 with defense-in-depth:
   * 1. Already encrypted by AES-256-GCM application envelope.
   * 2. Encrypted at rest in S3 using ServerSideEncryption (SSE-KMS or SSE-S3 AES256).
   * 3. SHA-256 cryptographic checksum stored as immutable metadata.
   * 4. Private ACL & strict partition key: vaults/{vaultId}/items/{itemId}/{fileName}.
   */
  async uploadEncryptedCiphertext(params: {
    key: string;
    ciphertext: Buffer;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<S3UploadResult> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error(
        'Cannot upload to S3: AWS S3 credentials or bucket are not configured.',
      );
    }

    // Compute SHA-256 checksum of the ciphertext for integrity assurance
    const checksumSha256 = createHash('sha256')
      .update(params.ciphertext)
      .digest('hex');

    const sse: ServerSideEncryption = this.kmsKeyId
      ? ServerSideEncryption.aws_kms
      : ServerSideEncryption.AES256;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      Body: params.ciphertext,
      ContentType: params.contentType || 'application/octet-stream',
      ServerSideEncryption: sse,
      ...(this.kmsKeyId ? { SSEKMSKeyId: this.kmsKeyId } : {}),
      Metadata: {
        ...(params.metadata || {}),
        'sha256-checksum': checksumSha256,
        'uploaded-at': new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    return {
      key: params.key,
      bucket: this.bucketName,
      s3Uri: `s3://${this.bucketName}/${params.key}`,
      checksumSha256,
      sizeBytes: params.ciphertext.length,
      serverSideEncryption: sse,
      kmsKeyId: this.kmsKeyId,
    };
  }

  /**
   * Download encrypted ciphertext from S3 and verify its SHA-256 checksum.
   */
  async downloadEncryptedCiphertext(key: string): Promise<S3DownloadResult> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('Cannot download from S3: AWS S3 is not configured.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error(`S3 GetObject returned empty body for key: ${key}`);
    }

    const chunks: Buffer[] = [];
    const stream = response.Body as Readable;

    for await (const chunk of stream) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : typeof chunk === 'string'
            ? Buffer.from(chunk)
            : Buffer.from(chunk as Uint8Array),
      );
    }

    const ciphertext = Buffer.concat(chunks);
    const metadata = response.Metadata || {};
    const expectedChecksum = metadata['sha256-checksum'];

    let checksumVerified = false;
    if (expectedChecksum) {
      const actualChecksum = createHash('sha256')
        .update(ciphertext)
        .digest('hex');

      if (actualChecksum !== expectedChecksum) {
        throw new Error(
          `S3 object cryptographic checksum mismatch! Expected: ${expectedChecksum}, got: ${actualChecksum}`,
        );
      }
      checksumVerified = true;
    }

    return {
      key,
      ciphertext,
      contentType: response.ContentType,
      metadata,
      checksumVerified,
    };
  }

  /**
   * Check if an object exists in S3.
   */
  async objectExists(key: string): Promise<boolean> {
    if (!this.s3Client || !this.bucketName) return false;

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an object from S3.
   */
  async deleteObject(key: string): Promise<void> {
    if (!this.s3Client || !this.bucketName) return;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${key}:`, error);
    }
  }

  /**
   * Generate a time-limited presigned URL for secure temporary direct access.
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error(
        'Cannot generate presigned URL: AWS S3 is not configured.',
      );
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}
