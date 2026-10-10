/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { S3StorageService } from './s3-storage.service';
import { StorageService } from './storage.service';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

describe('Storage and S3 Security', () => {
  let tempDir: string;
  let prevDir: string | undefined;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'virasat-s3-test-'));
    prevDir = process.env.PRIVATE_STORAGE_DIR;
    process.env.PRIVATE_STORAGE_DIR = tempDir;
  });

  afterEach(async () => {
    if (prevDir === undefined) {
      delete process.env.PRIVATE_STORAGE_DIR;
    } else {
      process.env.PRIVATE_STORAGE_DIR = prevDir;
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it('rejects upload immediately when S3 is unconfigured (no local fallback)', async () => {
    const s3Service = new S3StorageService();
    expect(s3Service.isConfigured()).toBe(false);

    const storage = new StorageService(s3Service);
    const testCiphertext = Buffer.from('encrypted-vault-payload-aes-256-gcm');

    await expect(
      storage.saveVaultItemFile({
        vaultId: 'vault-123',
        ciphertext: testCiphertext,
        mimeType: 'application/pdf',
      }),
    ).rejects.toThrow('AWS S3 is not configured');
  });

  it('supports IAM credential providers without static AWS keys', () => {
    const settings = [
      'AWS_S3_BUCKET_NAME',
      'AWS_S3_BUCKET',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
    ];
    const previous = Object.fromEntries(
      settings.map((key) => [key, process.env[key]]),
    );
    try {
      settings.forEach((key) => delete process.env[key]);
      process.env.AWS_S3_BUCKET_NAME = 'role-backed-test-bucket';
      expect(new S3StorageService().isConfigured()).toBe(true);
      process.env.AWS_ACCESS_KEY_ID = 'incomplete-test-pair';
      expect(() => new S3StorageService()).toThrow(
        'both AWS access key fields',
      );
    } finally {
      for (const key of settings) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  });

  it('uploads to S3 with SHA-256 checksum, SSE encryption, and partitioned key structure', async () => {
    const s3Service = new S3StorageService();
    const mockSend = jest.fn().mockResolvedValue({});
    (s3Service as any).s3Client = { send: mockSend };
    (s3Service as any).bucketName = 'secure-vault-bucket';
    (s3Service as any).configured = true;

    expect(s3Service.isConfigured()).toBe(true);

    const storage = new StorageService(s3Service);
    const ciphertext = Buffer.from('confidential-vault-ciphertext');
    const expectedHash = createHash('sha256').update(ciphertext).digest('hex');

    const upload = await storage.saveVaultItemFile({
      vaultId: 'vault-abc-456',
      itemId: 'item-xyz-789',
      ciphertext,
      mimeType: 'image/png',
      metadata: { originalName: 'will.png' },
    });

    expect(upload.storageType).toBe('S3');
    expect(upload.checksumSha256).toBe(expectedHash);
    expect(upload.storageKey).toMatch(
      /^vaults\/vault-abc-456\/items\/item-xyz-789\/[a-f0-9-]+\.bin$/,
    );
    expect(upload.s3Uri).toBe(`s3://secure-vault-bucket/${upload.storageKey}`);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.Bucket).toBe('secure-vault-bucket');
    expect(putCommand.input.Key).toBe(upload.storageKey);
    expect(putCommand.input.ContentType).toBe('image/png');
    expect(putCommand.input.ServerSideEncryption).toBe('AES256');
    expect(putCommand.input.Metadata['sha256-checksum']).toBe(expectedHash);
    expect(putCommand.input.Metadata['vault-id']).toBe('vault-abc-456');
  });

  it('detects tampering and rejects corrupted S3 downloads', async () => {
    const s3Service = new S3StorageService();
    const originalCiphertext = Buffer.from('pristine-envelope-data');
    const tamperedCiphertext = Buffer.from('tampered-corrupted-data');
    const originalHash = createHash('sha256')
      .update(originalCiphertext)
      .digest('hex');

    // S3 returns altered bytes with the original checksum metadata
    const mockStream = (async function* () {
      yield tamperedCiphertext;
    })();

    const mockSend = jest.fn().mockResolvedValue({
      Body: mockStream,
      Metadata: { 'sha256-checksum': originalHash },
      ContentType: 'application/octet-stream',
    });

    (s3Service as any).s3Client = { send: mockSend };
    (s3Service as any).bucketName = 'secure-vault-bucket';
    (s3Service as any).configured = true;

    await expect(
      s3Service.downloadEncryptedCiphertext('vaults/v1/items/i1/file.bin'),
    ).rejects.toThrow('S3 object cryptographic checksum mismatch');
  });

  it('migrates local vault items to S3 seamlessly', async () => {
    const s3Service = new S3StorageService();
    const storage = new StorageService(s3Service);

    // Simulate an existing legacy local file on disk
    const ciphertext = Buffer.from('legacy-local-file-content');
    const legacyFileName = 'legacy-local-file.bin';
    await writeFile(resolve(tempDir, legacyFileName), ciphertext);

    // Now configure S3
    const mockSend = jest.fn().mockResolvedValue({});
    (s3Service as any).s3Client = { send: mockSend };
    (s3Service as any).bucketName = 'migrated-vault-bucket';
    (s3Service as any).configured = true;

    // Migrate
    const migration = await storage.migrateLocalFileToS3({
      vaultId: 'vault-1',
      itemId: 'item-1',
      localFileName: legacyFileName,
      mimeType: 'application/pdf',
    });

    expect(migration.storageType).toBe('S3');
    expect(migration.storageKey).toMatch(
      /^vaults\/vault-1\/items\/item-1\/[a-f0-9-]+\.bin$/,
    );
    expect(migration.s3Uri).toBe(
      `s3://migrated-vault-bucket/${migration.storageKey}`,
    );
  });

  it('rejects local references outside the private storage directory', async () => {
    const storage = new StorageService(new S3StorageService());
    await expect(
      storage.readVaultItemCiphertext('../outside.bin'),
    ).rejects.toThrow('Invalid local storage reference');
    await expect(
      storage.deleteVaultItemFile('/tmp/outside.bin'),
    ).rejects.toThrow('Invalid local storage reference');
    await expect(
      storage.migrateLocalFileToS3({
        vaultId: 'vault',
        itemId: 'item',
        localFileName: '../outside.bin',
      }),
    ).rejects.toThrow();
  });
});
