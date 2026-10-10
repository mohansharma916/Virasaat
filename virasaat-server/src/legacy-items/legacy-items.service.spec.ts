jest.mock('../auth/guards/jwt-auth.guard', () => ({ JwtAuthGuard: class {} }));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { EncryptionService } from '../encryption/encryption.service';
import { LegacyItemsService } from './legacy-items.service';
import { LegacyItemsController } from './legacy-items.controller';
import { LegacyItem, LegacyItemType } from './entities/legacy-item.entity';

describe('owner vault recovery', () => {
  let previous: Record<string, string | undefined>;
  const settings = [
    'ENCRYPTION_MASTER_KEY',
    'ENCRYPTION_MASTER_KEY_VERSION',
    'ENCRYPTION_MASTER_KEYS',
  ];
  beforeEach(() => {
    previous = Object.fromEntries(
      settings.map((key) => [key, process.env[key]]),
    );
    settings.forEach((key) => delete process.env[key]);
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 7).toString('base64');
  });
  afterEach(() => {
    for (const key of settings) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  const fixture = () => {
    const rows = new Map<string, LegacyItem>();
    const ciphertexts = new Map<string, Buffer>();
    const query = {
      params: {} as { itemId?: string; vaultId?: string },
      addSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn(function (this: typeof query, _sql, params) {
        this.params = params;
        return this;
      }),
      getOne: jest.fn(async () => {
        const row = rows.get(query.params.itemId!);
        return row?.vaultId === query.params.vaultId ? row : null;
      }),
      getMany: jest.fn(async () =>
        [...rows.values()].filter(
          (row) => row.vaultId === query.params.vaultId,
        ),
      ),
    };
    const repository = {
      create: jest.fn((data) => ({ id: `item-${rows.size + 1}`, ...data })),
      save: jest.fn(async (item: LegacyItem) => {
        rows.set(item.id, item);
        return item;
      }),
      createQueryBuilder: () => query,
      find: jest.fn(async () => [...rows.values()]),
      manager: {
        transaction: async (run) => run({ getRepository: () => repository }),
      },
    };
    const storage = {
      isS3Enabled: () => true,
      saveVaultItemFile: jest.fn(async (input) => {
        const key = `vaults/vault/items/item/${ciphertexts.size}.bin`;
        ciphertexts.set(key, input.ciphertext);
        return {
          storageType: 'S3',
          storageKey: key,
          sizeBytes: input.ciphertext.length,
        };
      }),
      readVaultItemCiphertext: jest.fn(async (ref: string) =>
        ciphertexts.get(ref),
      ),
      migrateLocalFileToS3: jest.fn(),
      backupItemPayloadToS3: jest.fn(async (_input: unknown) => ({
        key: 'backup.enc',
        checksumSha256: 'checksum',
      })),
    };
    const encryption = new EncryptionService();
    const service = new LegacyItemsService(
      repository as never,
      {} as never,
      {} as never,
      {
        getUserVault: async (owner: string) => ({
          id: owner === 'owner' ? 'vault' : 'other-vault',
        }),
      } as never,
      encryption,
      storage as never,
    );
    return {
      rows,
      ciphertexts,
      repository,
      query,
      storage,
      encryption,
      service,
      controller: new LegacyItemsController(service),
    };
  };

  it.each([LegacyItemType.TEXT, LegacyItemType.FINANCIAL])(
    'recovers %s without treating inline bytes as a path',
    async (type) => {
      const { service, storage, controller } = fixture();
      const created = await service.create('owner', {
        type,
        category: 'PRIVATE',
        title: 'Owner title',
        description: 'Private saved details',
      });
      // Mimic rows written before the discriminator and envelope-version fields existed.
      created.payloadStorageType = null;
      const oldEnvelope = JSON.parse(created.encryptionKeyRef!);
      delete oldEnvelope.storageType;
      delete oldEnvelope.keyVersion;
      created.encryptionKeyRef = JSON.stringify(oldEnvelope);
      expect(await service.findOne('owner', created.id)).toMatchObject({
        description: 'Private saved details',
        hasFile: false,
      });
      expect(await controller.findAll({ user: { id: 'owner' } })).toEqual([
        expect.objectContaining({ description: null }),
      ]);
      expect(
        (await controller.findAll({ user: { id: 'owner' } }))[0],
      ).not.toHaveProperty('encryptionKeyRef');
      await expect(service.downloadFile('owner', created.id)).rejects.toThrow(
        'does not contain an uploaded file',
      );
      expect(storage.readVaultItemCiphertext).not.toHaveBeenCalled();
      await expect(service.findOne('intruder', created.id)).rejects.toThrow(
        'not found',
      );
    },
  );

  it('encrypts edits and preserves an assigned release snapshot', async () => {
    const { service, rows, query } = fixture();
    const created = await service.create('owner', {
      type: LegacyItemType.TEXT,
      category: 'MESSAGES',
      title: 'Old',
      description: 'Old details',
    });
    created.assignment = {
      recipientId: 'person',
      policyId: 'policy',
      policyVersion: 2,
      verificationRequired: true,
      trigger: 'MANUAL',
      verificationLevel: 'STANDARD',
      escalationConfig: { manualReviewRequired: true },
      assignedAt: '2026-10-10',
    };
    const original = structuredClone(created.assignment);
    const detail = await service.update('owner', created.id, {
      title: 'Updated',
      description: 'New private details',
    });
    expect(detail).toMatchObject({
      title: 'Updated',
      description: 'New private details',
      assignment: original,
    });
    expect(rows.get(created.id)?.description).toBeNull();
    expect(rows.get(created.id)?.ciphertextRef).not.toContain(
      'private details',
    );
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
    await expect(
      service.update('intruder', created.id, { description: 'overwrite' }),
    ).rejects.toThrow('not found');
    expect((await service.findOne('owner', created.id)).description).toBe(
      'New private details',
    );
    expect(
      (await service.update('owner', created.id, { description: '' }))
        .description,
    ).toBe('');
  });

  it('downloads original file bytes/name after a description edit and key rotation', async () => {
    const { service } = fixture();
    const originalKey = process.env.ENCRYPTION_MASTER_KEY!;
    const original = Buffer.from([0, 255, 80, 68, 70, 37, 128]);
    const item = await service.createEncryptedUpload(
      'owner',
      {
        type: LegacyItemType.DOCUMENT,
        category: 'DOCUMENTS',
        title: 'My will',
        description: 'Original note',
      },
      {
        buffer: original,
        mimetype: 'application/pdf',
        originalname: 'private-will.pdf',
      },
    );
    expect(item.encryptionKeyRef).not.toContain('private-will.pdf');
    process.env.ENCRYPTION_MASTER_KEY_VERSION = 'v2';
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString('base64');
    process.env.ENCRYPTION_MASTER_KEYS = JSON.stringify({ v1: originalKey });
    const detail = await service.update('owner', item.id, {
      description: 'Updated private note',
    });
    expect(detail).toMatchObject({
      description: 'Updated private note',
      hasFile: true,
      fileName: 'private-will.pdf',
      mimeType: 'application/pdf',
      sizeBytes: original.length,
    });
    expect(detail).not.toHaveProperty('encryptionKeyRef');
    const download = await service.downloadFile('owner', item.id);
    expect(download.buffer).toEqual(original);
    expect(download.filename).toBe('private-will.pdf');
    await expect(service.downloadFile('intruder', item.id)).rejects.toThrow(
      'not found',
    );
  });

  it('backs up inline records with a complete recoverable envelope', async () => {
    const { service, storage, encryption } = fixture();
    const created = await service.create('owner', {
      type: LegacyItemType.FINANCIAL,
      category: 'INVESTMENTS',
      title: 'Account',
      description: 'Sensitive reference',
    });
    const result = await service.syncAllVaultItemsToS3('owner');
    expect(result.items[0].action).toBe('BACKED_UP_TO_S3');
    expect(storage.migrateLocalFileToS3).not.toHaveBeenCalled();
    const request = storage.backupItemPayloadToS3.mock.calls[0][0] as any;
    const backupEnvelope = JSON.parse(
      request.encryptedPayload.toString('utf8'),
    );
    expect(backupEnvelope.formatVersion).toBe(1);
    expect(backupEnvelope.keyVersion).toBe('v1');
    expect(request.encryptedPayload.toString('utf8')).not.toContain(
      'Sensitive reference',
    );
    const restored = JSON.parse(
      encryption
        .decrypt({
          ...backupEnvelope,
          ciphertext: Buffer.from(backupEnvelope.ciphertext, 'base64'),
        })
        .toString('utf8'),
    );
    expect(restored).toMatchObject({
      id: created.id,
      payloadStorageType: 'INLINE_DB',
    });
    const envelope = JSON.parse(restored.encryptionKeyRef);
    expect(
      encryption
        .decrypt({
          ...envelope,
          ciphertext: Buffer.from(restored.ciphertextRef, 'base64'),
          keyVersion: restored.encryptionKeyVersion,
        })
        .toString(),
    ).toBe('Sensitive reference');
  });

  it('reads legacy local files and preserves concurrent notes during S3 migration', async () => {
    const { service, storage, rows, ciphertexts, query, encryption } =
      fixture();
    const original = Buffer.from('legacy PDF bytes');
    const encrypted = encryption.encrypt(original);
    const encryptedNote = encryption.encrypt(Buffer.from('Old legacy note'));
    const { ciphertext, keyVersion: _version, ...oldEnvelope } = encrypted;
    const {
      ciphertext: noteBytes,
      keyVersion: _noteVersion,
      ...oldNote
    } = encryptedNote;
    const local = {
      id: 'old-local',
      vaultId: 'vault',
      type: LegacyItemType.DOCUMENT,
      category: 'DOCUMENTS',
      title: 'Legacy.pdf',
      description: null,
      ciphertextRef: 'old-file.bin',
      encryptionKeyVersion: 'v1',
      payloadStorageType: null,
      encryptionKeyRef: JSON.stringify({
        ...oldEnvelope,
        mimeType: 'application/pdf',
        description: { ...oldNote, ciphertext: noteBytes.toString('base64') },
      }),
    } as LegacyItem;
    rows.set(local.id, local);
    ciphertexts.set(local.ciphertextRef!, ciphertext);
    const download = await service.downloadFile('owner', local.id);
    expect(download).toMatchObject({
      buffer: original,
      storageType: 'LOCAL',
      filename: 'Legacy.pdf',
    });
    expect((await service.findOne('owner', local.id)).description).toBe(
      'Old legacy note',
    );

    query.getMany.mockImplementationOnce(async () => {
      const staleSnapshot = structuredClone(local);
      await service.update('owner', local.id, { description: 'Edited note' });
      return [staleSnapshot];
    });
    storage.migrateLocalFileToS3.mockImplementation(async (input) => {
      const key = 'vaults/vault/items/old-local/migrated.bin';
      ciphertexts.set(key, ciphertexts.get(input.localFileName)!);
      return {
        storageType: 'S3',
        storageKey: key,
        sizeBytes: ciphertext.length,
      };
    });
    expect((await service.syncAllVaultItemsToS3('owner')).items[0].action).toBe(
      'MIGRATED_TO_S3',
    );
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect((await service.findOne('owner', local.id)).description).toBe(
      'Edited note',
    );
    expect((await service.downloadFile('owner', local.id)).buffer).toEqual(
      original,
    );
  });
});
