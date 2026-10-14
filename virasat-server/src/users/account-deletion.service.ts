import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ReauthService, type ReauthProof } from './reauth.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notification/notifications.service';
import { EmailTemplateType } from '../notification/email/email-template.types';
import { maskEmail } from '../notification/email/log-redaction';

// Rows owned through the user id, deleted children first. Tables that do not
// exist in a given database (older schemas) are skipped.
const USER_ROWS: Array<[table: string, where: string]> = [
  [
    'check_in_events',
    `"policyId" IN (SELECT id FROM check_in_policies WHERE "userId" = $1)`,
  ],
  ['check_in_policies', `"userId" = $1`],
  [
    'release_authorizations',
    `"caseId" IN (SELECT id FROM release_cases WHERE "userId" = $1)`,
  ],
  ['release_cases', `"userId" = $1`],
  ['release_policy_snapshots', `"userId" = $1`],
  ['release_policies', `"userId" = $1`],
  ['recipients', `"userId" = $1`],
  ['subscriptions', `"userId" = $1`],
  ['notifications', `"userId" = $1`],
  ['audit_events', `"actorId" = $1`],
  ['legacy_items', `"vaultId" IN (SELECT id FROM vaults WHERE "userId" = $1)`],
  ['vaults', `"userId" = $1`],
];
// Rows keyed only by email address.
const EMAIL_ROWS = [
  'email_signups',
  'password_resets',
  'email_verifications',
  'waitlist',
];

/**
 * Permanently deletes an account and everything stored for it. Required by
 * Google Play for apps that create accounts. Database rows are removed in one
 * transaction; vault files are removed afterwards. Even if a file removal
 * fails, its data key was stored only in the deleted rows, so the remaining
 * ciphertext can no longer be decrypted.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly reauth: ReauthService,
    private readonly storage: StorageService,
    @Optional()
    private readonly notifications?: NotificationsService,
  ) {}

  async deleteAccount(userId: string, proof: ReauthProof) {
    await this.reauth.verify(userId, proof);
    const removed = await this.users.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `account-deletion:${userId}`,
      ]);
      const user = await manager
        .getRepository(User)
        .findOne({
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });
      if (!user) throw new NotFoundException('Account not found.');
      const existing = new Set(
        (
          (await manager.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`,
          )) as Array<{ table_name: string }>
        ).map((row) => row.table_name),
      );
      const vaults = (await manager.query(
        `SELECT id FROM vaults WHERE "userId" = $1`,
        [userId],
      )) as Array<{ id: string }>;
      const localRefs = existing.has('legacy_items')
        ? (
            (await manager.query(
              `SELECT "ciphertextRef" FROM legacy_items
               WHERE "vaultId" IN (SELECT id FROM vaults WHERE "userId" = $1)
                 AND "payloadStorageType" = 'LOCAL' AND "ciphertextRef" IS NOT NULL`,
              [userId],
            )) as Array<{ ciphertextRef: string }>
          ).map((row) => row.ciphertextRef)
        : [];
      for (const [table, where] of USER_ROWS)
        if (existing.has(table))
          await manager.query(`DELETE FROM "${table}" WHERE ${where}`, [
            userId,
          ]);
      for (const table of EMAIL_ROWS)
        if (existing.has(table))
          await manager.query(`DELETE FROM "${table}" WHERE email = $1`, [
            user.email,
          ]);
      await manager.query(`DELETE FROM users WHERE id = $1`, [userId]);
      return {
        email: user.email,
        name: user.name,
        vaultIds: vaults.map((vault) => vault.id),
        localRefs,
      };
    });

    let filesRemoved = true;
    for (const vaultId of removed.vaultIds)
      filesRemoved =
        (await this.storage.deleteVaultFiles(vaultId, removed.localRefs)) &&
        filesRemoved;
    this.logger.log(
      `Account deleted for ${maskEmail(removed.email)}${filesRemoved ? '' : ' (file cleanup incomplete; ciphertext is unrecoverable)'}`,
    );

    await this.notifications
      ?.sendTemplatedEmail({
        to: removed.email,
        templateType: EmailTemplateType.SECURITY_ALERT,
        data: {
          recipientName: removed.name,
          alertTitle: 'Your Virasat account was deleted',
          alertDescription:
            'Your account, vault items, trusted people and settings have been permanently deleted at your request. This cannot be undone. If you did not request this, contact support immediately.',
          eventTime: new Date().toUTCString(),
          deviceInfo: 'Virasat account services',
        },
      })
      .catch(() =>
        this.logger.warn('Account deletion confirmation could not be sent.'),
      );

    return {
      status: 'DELETED',
      message: 'Your account and all vault data have been permanently deleted.',
    };
  }
}
