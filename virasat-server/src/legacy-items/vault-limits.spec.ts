jest.mock('../auth/guards/jwt-auth.guard', () => ({ JwtAuthGuard: class {} }));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

import { ForbiddenException } from '@nestjs/common';
import { Subject, lastValueFrom, of } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';
import { RecipientsService } from '../recipients/recipients.service';
import { RecipientStatus } from '../recipients/entities/recipient.entity';
import { LegacyItemsController } from './legacy-items.controller';
import { LegacyItemsService } from './legacy-items.service';
import { LegacyItem, LegacyItemType } from './entities/legacy-item.entity';
import { UploadSlotInterceptor } from './upload-slot.interceptor';
import { PlanLimit } from '../subscriptions/subscription.constants';

const MP4_HEADER = Buffer.from([
  0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0,
]);

function fixture(usage = { items: 0, bytes: 0, texts: 0, videos: 0 }) {
  const rows = new Map<string, LegacyItem>();
  const locks: unknown[][] = [];
  const query = {
    addSelect: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(async () => null),
  };
  const repository = {
    create: (data: Partial<LegacyItem>) =>
      ({ id: `item-${rows.size + 1}`, ...data }) as LegacyItem,
    save: jest.fn(async (item: LegacyItem) => {
      rows.set(item.id, item);
      return item;
    }),
    find: jest.fn(async () => [...rows.values()]),
    createQueryBuilder: () => query,
    manager: {
      transaction: async (run: (manager: unknown) => unknown) =>
        run({
          getRepository: () => repository,
          query: async (sql: string, params: unknown[]) => {
            locks.push([sql, ...params]);
            return sql.includes('advisory') ? [] : [usage];
          },
        }),
    },
  };
  const storage = {
    saveVaultItemFile: jest.fn(async (input: { ciphertext: Buffer }) => ({
      storageType: 'S3',
      storageKey: 'vaults/vault/items/object.bin',
      sizeBytes: input.ciphertext.length,
    })),
    deleteVaultItemFile: jest.fn(async () => undefined),
  };
  const plans = { assertWithinLimit: jest.fn(async () => undefined) };
  const reauth = { verify: jest.fn(async () => undefined) };
  const service = new LegacyItemsService(
    repository as never,
    {} as never,
    {} as never,
    { getUserVault: async () => ({ id: 'vault' }) } as never,
    new EncryptionService(),
    storage as never,
    plans as never,
    reauth as never,
  );
  return { service, rows, storage, plans, reauth, locks };
}

describe('vault limits and stored metadata', () => {
  let previousKey: string | undefined;
  beforeEach(() => {
    previousKey = process.env.ENCRYPTION_MASTER_KEY;
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString('base64');
  });
  afterEach(() => {
    if (previousKey === undefined) delete process.env.ENCRYPTION_MASTER_KEY;
    else process.env.ENCRYPTION_MASTER_KEY = previousKey;
  });

  it('counts a video uploaded as a document against the video limit', async () => {
    const { service, plans, rows } = fixture({
      items: 3,
      bytes: 0,
      texts: 0,
      videos: 1,
    });
    await service.createEncryptedUpload(
      'owner',
      { type: LegacyItemType.DOCUMENT, category: 'DOCUMENTS', title: 'Clip' },
      {
        buffer: Buffer.concat([MP4_HEADER, Buffer.alloc(64)]),
        mimetype: 'application/pdf',
      },
    );
    expect(plans.assertWithinLimit).toHaveBeenCalledWith(
      'owner',
      PlanLimit.VIDEO_MESSAGES,
      1,
    );
    const stored = [...rows.values()][0];
    expect(stored.encryptionKeyRef).toContain('"contentKind":"VIDEO"');
  });

  it('counts text uploads against the message limit on either endpoint', async () => {
    const { service, plans } = fixture({
      items: 1,
      bytes: 0,
      texts: 3,
      videos: 0,
    });
    await service.createEncryptedUpload(
      'owner',
      { type: LegacyItemType.TEXT, category: 'MESSAGES', title: 'Note' },
      { buffer: Buffer.from('a private note'), mimetype: 'text/plain' },
    );
    expect(plans.assertWithinLimit).toHaveBeenCalledWith(
      'owner',
      PlanLimit.PERSONAL_MESSAGES,
      3,
    );
  });

  it('serializes the limit check per vault and rejects uploads over the storage quota', async () => {
    const previous = process.env.VAULT_STORAGE_QUOTA_MB;
    process.env.VAULT_STORAGE_QUOTA_MB = '1';
    try {
      const { service, storage, locks, rows } = fixture({
        items: 1,
        bytes: 1024 * 1024 - 10,
        texts: 0,
        videos: 0,
      });
      await expect(
        service.createEncryptedUpload(
          'owner',
          {
            type: LegacyItemType.DOCUMENT,
            category: 'DOCUMENTS',
            title: 'Scan',
          },
          { buffer: Buffer.alloc(100), mimetype: 'application/pdf' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(locks[0]).toEqual([
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        'vault-items:vault',
      ]);
      // The already-uploaded ciphertext is removed when the save is refused.
      expect(storage.deleteVaultItemFile).toHaveBeenCalled();
      expect(rows.size).toBe(0);
    } finally {
      if (previous === undefined) delete process.env.VAULT_STORAGE_QUOTA_MB;
      else process.env.VAULT_STORAGE_QUOTA_MB = previous;
    }
  });

  it('encrypts titles at rest and keeps them out of object metadata', async () => {
    const { service, storage, rows } = fixture();
    const created = await service.createEncryptedUpload(
      'owner',
      {
        type: LegacyItemType.DOCUMENT,
        category: 'DOCUMENTS',
        title: 'हिंदी वसीयत – bank login',
      },
      { buffer: Buffer.from('%PDF-1.7'), mimetype: 'text/html' },
    );
    expect(created.title).toBe('हिंदी वसीयत – bank login');
    const stored = rows.get(created.id)!;
    expect(stored.title.startsWith('enc1:')).toBe(true);
    expect(stored.title).not.toContain('bank');
    const [[input]] = storage.saveVaultItemFile.mock.calls as unknown as [
      [{ metadata: Record<string, string>; mimeType: string }],
    ];
    expect(input.metadata).toEqual({ itemType: LegacyItemType.DOCUMENT });
    // Unsafe types are stored as opaque bytes.
    expect(input.mimeType).toBe('application/octet-stream');
    expect((await service.findAll('owner'))[0].title).toBe(
      'हिंदी वसीयत – bank login',
    );
  });

  it('reads titles saved before encryption', async () => {
    const { service, rows } = fixture();
    rows.set('legacy', {
      id: 'legacy',
      vaultId: 'vault',
      title: 'Plain title',
    } as LegacyItem);
    expect((await service.findAll('owner'))[0].title).toBe('Plain title');
  });

  it('only accepts multipart files on the upload endpoint', async () => {
    const { service } = fixture();
    const controller = new LegacyItemsController(service);
    await expect(
      controller.upload(
        {
          user: { id: 'owner' },
          body: { file: 'data:text/html;base64,PHNjcmlwdD4=' },
        },
        undefined,
        { type: LegacyItemType.DOCUMENT, category: 'DOCUMENTS', title: 'x' },
      ),
    ).rejects.toThrow('A file is required');
  });

  it('limits concurrent uploads per user before the file is buffered', async () => {
    const interceptor = new UploadSlotInterceptor();
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'owner' } }) }),
    } as never;
    const pending = { handle: () => new Subject() };
    interceptor.intercept(context, pending).subscribe();
    interceptor.intercept(context, pending).subscribe();
    expect(() => interceptor.intercept(context, pending)).toThrow(
      'Too many uploads',
    );
    const other = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'other' } }) }),
    } as never;
    await expect(
      lastValueFrom(interceptor.intercept(other, { handle: () => of('done') })),
    ).resolves.toBe('done');
  });
});

describe('trusted person changes', () => {
  const recipientFixture = (status: RecipientStatus) => {
    const saved = {
      id: 'person',
      userId: 'owner',
      email: 'old@example.test',
      name: 'Person',
      status,
    };
    const repository = {
      findOne: jest.fn(async ({ where }: { where: Record<string, string> }) =>
        where.id === 'person' ? { ...saved } : null,
      ),
      save: jest.fn(async (value: unknown) => value),
      manager: {
        transaction: async (run: (manager: unknown) => unknown) =>
          run({ query: async () => [], getRepository: () => repository }),
      },
    };
    return { service: new RecipientsService(repository as never), repository };
  };

  it('updates the email of a private person', async () => {
    const { service } = recipientFixture(RecipientStatus.PRIVATE);
    await expect(
      service.update('owner', 'person', { email: ' New@Example.test ' }),
    ).resolves.toMatchObject({ email: 'new@example.test' });
  });

  it('refuses to change the email once the person has been contacted', async () => {
    const { service, repository } = recipientFixture(RecipientStatus.INVITED);
    await expect(
      service.update('owner', 'person', { email: 'new@example.test' }),
    ).rejects.toThrow('cannot be changed');
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('item reassignment', () => {
  const assignmentFixture = () => {
    const base = fixture();
    const item = {
      id: 'item',
      vaultId: 'vault',
      title: 'Plain',
      status: 'ACTIVE',
      assignment: {
        recipientId: 'first',
        policyId: 'policy',
        policyVersion: 1,
      },
    };
    const repositories = {
      item: {
        findOne: async () => ({ ...item }),
        save: jest.fn(async (value: unknown) => value),
      },
      other: {
        findOne: async ({ where }: { where: { id: string } }) =>
          where.id === 'policy'
            ? {
                id: 'policy',
                version: 1,
                verificationRequired: true,
                escalationConfig: {},
              }
            : { id: where.id, status: RecipientStatus.PRIVATE },
        save: jest.fn(async (value: unknown) => value),
      },
    };
    const service = new LegacyItemsService(
      {
        manager: {
          transaction: async (run: (manager: unknown) => unknown) =>
            run({
              getRepository: (entity: unknown) =>
                entity === LegacyItem ? repositories.item : repositories.other,
            }),
        },
      } as never,
      {} as never,
      {} as never,
      { getUserVault: async () => ({ id: 'vault' }) } as never,
      new EncryptionService(),
      {} as never,
      undefined,
      base.reauth as never,
    );
    return { service, reauth: base.reauth, repositories };
  };
  const request = {
    recipientId: 'second',
    policyId: 'policy',
    policyVersion: 1,
  };

  it('requires identity confirmation to send an item to someone else', async () => {
    const { service, repositories } = assignmentFixture();
    await expect(
      service.assign('owner', 'item', request),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'REAUTH_REQUIRED' }),
    });
    expect(repositories.item.save).not.toHaveBeenCalled();
  });

  it('reassigns after the password is confirmed', async () => {
    const { service, reauth } = assignmentFixture();
    await expect(
      service.assign('owner', 'item', {
        ...request,
        currentPassword: 'secret',
      }),
    ).resolves.toMatchObject({ assignment: { recipientId: 'second' } });
    expect(reauth.verify).toHaveBeenCalledWith('owner', {
      currentPassword: 'secret',
      googleIdToken: undefined,
    });
  });
});
