import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const settings = [
    'ENCRYPTION_MASTER_KEY',
    'ENCRYPTION_MASTER_KEY_VERSION',
    'ENCRYPTION_MASTER_KEYS',
  ];
  let previous: Record<string, string | undefined>;

  beforeEach(async () => {
    previous = Object.fromEntries(
      settings.map((key) => [key, process.env[key]]),
    );
    settings.forEach((key) => delete process.env[key]);
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 1).toString('base64');
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    for (const key of settings) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('decrypts historical records after rotating the active key', () => {
    const originalKey = process.env.ENCRYPTION_MASTER_KEY!;
    const old = service.encrypt(Buffer.from('historical private record'));
    process.env.ENCRYPTION_MASTER_KEY_VERSION = 'v2';
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 2).toString('base64');
    process.env.ENCRYPTION_MASTER_KEYS = JSON.stringify({ v1: originalKey });
    const current = service.encrypt(Buffer.from('current private record'));
    expect(current.keyVersion).toBe('v2');
    expect(service.decrypt(old).toString()).toBe('historical private record');
    expect(service.decrypt({ ...old, keyVersion: undefined }).toString()).toBe(
      'historical private record',
    );
    expect(service.decrypt(current).toString()).toBe('current private record');
    delete process.env.ENCRYPTION_MASTER_KEYS;
    expect(() => service.decrypt(old)).toThrow(
      'required encryption key version',
    );
  });

  it('authenticates ciphertext and rejects malformed key configuration', () => {
    const encrypted = service.encrypt(Buffer.from('confidential'));
    const altered = Buffer.from(encrypted.ciphertext);
    altered[0] ^= 1;
    expect(() =>
      service.decrypt({ ...encrypted, ciphertext: altered }),
    ).toThrow();
    process.env.ENCRYPTION_MASTER_KEYS = '[]';
    expect(() => service.encrypt(Buffer.from('new'))).toThrow(
      'keyring is invalid',
    );
  });
});
