jest.mock('../auth/guards/jwt-auth.guard', () => ({ JwtAuthGuard: class {} }));
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { RecipientsService } from '../recipients/recipients.service';
import { Recipient, RecipientStatus } from '../recipients/entities/recipient.entity';
import { ReleaseService } from './release.service';
import { ReleasePolicy, ReleaseTrigger, VerificationLevel } from './entities/release-policy.entity';
import { LegacyItemsService } from '../legacy-items/legacy-items.service';
import { LegacyItem, LegacyItemStatus, LegacyItemType } from '../legacy-items/entities/legacy-item.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { CheckInService } from '../check-in/check-in.service';
import { CheckInPolicy, CheckInCadence } from '../check-in/entities/check-in-policy.entity';
import { CheckInEvent, CheckInEventStatus } from '../check-in/entities/check-in-event.entity';
import { UsersController } from '../users/users.controller';

describe('PRD 2.1 safety boundaries', () => {
  it('saves a private recipient without claiming an invitation was sent', async () => {
    const repository = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn((value: unknown) => value), save: jest.fn((value: unknown) => Promise.resolve(value)) };
    const service = new RecipientsService(repository as never);
    const person = await service.create('owner', { name: 'Sample', email: 'sample@example.test', verificationRequired: false });
    expect(person).toMatchObject({ status: RecipientStatus.PRIVATE, verificationRequired: false });
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('an explicit invitation fails honestly while delivery is unavailable', async () => {
    const repository = { findOne: jest.fn().mockResolvedValue({ id: 'person', status: RecipientStatus.PRIVATE }), save: jest.fn() };
    const service = new RecipientsService(repository as never);
    await expect(service.invite('owner', 'person')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('cannot self-authorize, replay an authorization, or access another recipient through legacy release services', async () => {
    const repository = { save: jest.fn() };
    const service = new ReleaseService(repository as never, repository as never, repository as never, repository as never, { log: jest.fn().mockResolvedValue({}) } as never);
    await expect(service.reviewCase('recipient', 'case', { status: 'APPROVED' } as never)).rejects.toBeInstanceOf(ForbiddenException);
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(service.authorizeRelease('recipient', 'case', { recipientId: 'person', expiresInDays: 1 })).rejects.toBeInstanceOf(ForbiddenException);
    }
    await expect(service.verifyAuthorization('another-person')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  const assignmentFixture = (verificationRequired: boolean) => {
    const item = { id: 'item', vaultId: 'vault', status: LegacyItemStatus.ACTIVE, assignment: null } as unknown as LegacyItem;
    const policy = { id: 'policy', version: 2, verificationRequired, trigger: ReleaseTrigger.CHECK_IN_ESCALATION, verificationLevel: VerificationLevel.STANDARD, escalationConfig: { manualReviewRequired: true } };
    const items = { findOne: jest.fn().mockResolvedValue(item), save: jest.fn((value: unknown) => Promise.resolve(value)), manager: {} };
    const people = { findOne: jest.fn().mockResolvedValue({ id: 'person', status: RecipientStatus.PRIVATE }) };
    const policies = { findOne: jest.fn().mockResolvedValue(policy) };
    const audit = { save: jest.fn().mockResolvedValue({}) };
    const manager = { getRepository: (entity: unknown) => entity === LegacyItem ? items : entity === Recipient ? people : entity === ReleasePolicy ? policies : entity === AuditEvent ? audit : undefined };
    items.manager = { transaction: (run: (value: typeof manager) => unknown) => run(manager) };
    const service = new LegacyItemsService(items as never, people as never, policies as never, { getUserVault: jest.fn().mockResolvedValue({ id: 'vault' }) } as never, {} as never);
    return { item, items, policy, people, service, audit };
  };

  it.each([true, false])('stores policy verification=%s without blocking private recipient assignment', async (required) => {
    const fixture = assignmentFixture(required);
    const result = await fixture.service.assign('owner', 'item', { recipientId: 'person', policyId: 'policy', policyVersion: 2 });
    expect(result.assignment).toMatchObject({ policyVersion: 2, verificationRequired: required, recipientId: 'person' });
    fixture.policy.escalationConfig.manualReviewRequired = false;
    expect(result.assignment?.escalationConfig.manualReviewRequired).toBe(true);
    expect(fixture.audit.save).toHaveBeenCalledTimes(1);
  });

  it('rejects stale policies, revoked recipients and items outside the owner vault', async () => {
    const fixture = assignmentFixture(true);
    await expect(fixture.service.assign('owner', 'item', { recipientId: 'person', policyId: 'policy', policyVersion: 1 })).rejects.toThrow('policy has changed');
    fixture.people.findOne.mockResolvedValue({ id: 'person', status: RecipientStatus.REVOKED });
    await expect(fixture.service.assign('owner', 'item', { recipientId: 'person', policyId: 'policy', policyVersion: 2 })).rejects.toThrow('available recipient');
    fixture.items.findOne.mockResolvedValue(null);
    await expect(fixture.service.assign('owner', 'other-item', { recipientId: 'person', policyId: 'policy', policyVersion: 2 })).rejects.toThrow('Item not found');
    expect(fixture.items.save).not.toHaveBeenCalled();
  });

  it('duplicate assignment is idempotent and a later policy change cannot silently replace it', async () => {
    const fixture = assignmentFixture(false);
    const request = { recipientId: 'person', policyId: 'policy', policyVersion: 2 };
    await fixture.service.assign('owner', 'item', request);
    await fixture.service.assign('owner', 'item', request);
    expect(fixture.items.save).toHaveBeenCalledTimes(1);
    await expect(fixture.service.assign('owner', 'item', { ...request, policyVersion: 3 })).rejects.toThrow('re-authentication');
  });

  it('deletion availability never reports an accepted or completed deletion without backend support', () => {
    const controller = new UsersController({} as never);
    expect(controller.deletionEligibility()).toMatchObject({ status: 'UNAVAILABLE' });
    expect(controller.deletionEligibility()).toMatchObject({ status: 'UNAVAILABLE' });
  });
  it('preserves uploaded bytes through storage without document extraction', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'virasat-integrity-'));
    const previous = process.env.PRIVATE_STORAGE_DIR;
    process.env.PRIVATE_STORAGE_DIR = directory;
    const original = Buffer.from([0, 255, 37, 80, 68, 70, 10, 128]);
    const encrypt = jest.fn((buffer: Buffer) => ({ ciphertext: buffer, encryptedDataKey: 'test', keyIv: 'test', keyAuthTag: 'test', iv: 'test', authTag: 'test', algorithm: 'test', keyVersion: 'test' }));
    const repository = { create: (data: unknown) => data, save: jest.fn((data: unknown) => Promise.resolve(data)) };
    const service = new LegacyItemsService(repository as never, {} as never, {} as never, { getUserVault: async () => ({ id: 'vault' }) } as never, { encrypt } as never);
    try {
      const saved = await service.createEncryptedUpload('owner', { type: LegacyItemType.DOCUMENT, category: 'DOCUMENTS', title: 'Sample', requestKey: 'upload-1' }, { buffer: original, mimetype: 'application/pdf' });
      expect(encrypt).toHaveBeenCalledTimes(1);
      expect(encrypt.mock.calls[0][0]).toEqual(original);
      expect(await readFile(join(directory, saved.ciphertextRef!))).toEqual(original);
    } finally {
      if (previous === undefined) delete process.env.PRIVATE_STORAGE_DIR;
      else process.env.PRIVATE_STORAGE_DIR = previous;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('retries return the original item and reject reuse of the key for different content', async () => {
    let saved: unknown;
    const query = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getOne: jest.fn(() => Promise.resolve(saved)) };
    const repository = { create: (data: unknown) => data, createQueryBuilder: () => query,
      save: jest.fn().mockImplementationOnce((value: unknown) => { saved = value; return Promise.resolve(value); }).mockRejectedValue({ code: '23505' }) };
    const encrypt = () => ({ ciphertext: Buffer.from('encrypted'), keyVersion: 'test' });
    const service = new LegacyItemsService(repository as never, {} as never, {} as never, { getUserVault: async () => ({ id: 'vault' }) } as never, { encrypt } as never);
    const request = { type: LegacyItemType.TEXT, category: 'MESSAGES', title: 'Sample', description: 'Test content', requestKey: 'stable-key' };
    const first = await service.create('owner', request);
    expect(await service.create('owner', request)).toEqual(first);
    await expect(service.create('owner', { ...request, description: 'Different content' })).rejects.toThrow('different content');
  });

  it('check-in retries confirm only the selected event once and never create release authorization', async () => {
    const policy = { id: 'policy', cadence: CheckInCadence.MONTHLY, preferredTime: '10:00', nextCheckInAt: new Date() };
    const event = { id: 'event', policyId: 'policy', status: CheckInEventStatus.PENDING };
    const policies = { findOne: jest.fn().mockResolvedValue(policy), save: jest.fn().mockResolvedValue(policy), manager: {} };
    const events = { findOne: jest.fn().mockResolvedValue(event), create: jest.fn((value: unknown) => value), save: jest.fn().mockResolvedValue({}) };
    const audit = { save: jest.fn().mockResolvedValue({}) };
    const manager = { getRepository: jest.fn((entity: unknown) => entity === CheckInPolicy ? policies : entity === CheckInEvent ? events : audit) };
    policies.manager = { transaction: (run: (value: typeof manager) => unknown) => run(manager) };
    const service = new CheckInService(policies as never, events as never);
    await expect(service.confirmCheckIn('owner', 'event')).resolves.toMatchObject({ success: true });
    await expect(service.confirmCheckIn('owner', 'event')).resolves.toMatchObject({ success: true });
    expect(events.create).toHaveBeenCalledTimes(1);
    expect(audit.save).toHaveBeenCalledTimes(1);
    expect(events.findOne).toHaveBeenCalledWith({ where: { id: 'event', policyId: 'policy' } });
    expect(manager.getRepository.mock.calls.every(([entity]) => [CheckInPolicy, CheckInEvent, AuditEvent].includes(entity as never))).toBe(true);
    event.status = CheckInEventStatus.ESCALATED;
    await expect(service.confirmCheckIn('owner', 'event')).rejects.toThrow('secure activity review');
    expect(events.create).toHaveBeenCalledTimes(1);
  });

});
