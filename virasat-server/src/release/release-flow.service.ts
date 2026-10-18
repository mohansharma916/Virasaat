import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuditResult } from '../audit/entities/audit-event.entity';
import { LegacyItemsService } from '../legacy-items/legacy-items.service';
import { EmailTemplateType } from '../notification/email/email-template.types';
import {
  escapeHtml,
  renderCtaButton,
  wrapInEmailLayout,
  wrapInPlainTextLayout,
} from '../notification/email/email-layout';
import { getEmailAppLink } from '../notification/email/email-links';
import { MailService } from '../notification/email/mail.service';
import { NotificationsService } from '../notification/notifications.service';
import {
  Recipient,
  RecipientStatus,
} from '../recipients/entities/recipient.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import {
  CheckInEvent,
  CheckInEventStatus,
} from '../check-in/entities/check-in-event.entity';
import { UsersService } from '../users/users.service';
import {
  AuthorizationStatus,
  ReleaseAuthorization,
} from './entities/release-authorization.entity';
import {
  ReleaseCase,
  ReleaseCaseStatus,
  ReleaseReason,
} from './entities/release-case.entity';

/** Trusted people have this long to confirm who they are. */
export const STATEMENT_WINDOW_DAYS = 14;
/** Released items stay readable this long after approval. */
export const ACCESS_DAYS = 365;
const MAX_STATEMENT_LENGTH = 2000;
const LIVE_CASE_STATUSES = [
  ReleaseCaseStatus.OPEN,
  ReleaseCaseStatus.UNDER_REVIEW,
  ReleaseCaseStatus.APPROVED,
];

export interface CaseStatement {
  recipientId: string;
  text: string;
  submittedAt: string;
}

export interface CaseEvidence {
  overdueDays?: number;
  dueAt?: string;
  lastCheckInAt?: string | null;
  note?: string;
  statements: CaseStatement[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const formatDate = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    dateStyle: 'long',
    timeZone: 'Asia/Kolkata',
  });

/**
 * The release lifecycle: invitations, opening a case after missed check-ins,
 * trusted-person statements, admin review, and access to released items.
 *
 * Safety rules enforced here:
 * - Only an admin (ADMIN_EMAIL, verified) can approve or reject a case.
 * - Access covers only items the owner assigned to that person.
 * - Any check-in by the owner closes live cases and revokes access at once.
 */
@Injectable()
export class ReleaseFlowService {
  private readonly logger = new Logger(ReleaseFlowService.name);

  constructor(
    @InjectRepository(ReleaseCase)
    private readonly caseRepository: Repository<ReleaseCase>,
    @InjectRepository(ReleaseAuthorization)
    private readonly authorizationRepository: Repository<ReleaseAuthorization>,
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
    @InjectRepository(CheckInEvent)
    private readonly checkInEventRepository: Repository<CheckInEvent>,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly legacyItemsService: LegacyItemsService,
    private readonly config: ConfigService,
  ) {}

  // -----------------------------------------------------------------
  // Admin identity
  // -----------------------------------------------------------------

  private adminEmails() {
    return (this.config.get<string>('ADMIN_EMAIL') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  isAdmin(user: Pick<User, 'email' | 'emailVerified' | 'status'> | null) {
    return Boolean(
      user &&
      user.emailVerified &&
      user.status === UserStatus.ACTIVE &&
      this.adminEmails().includes(user.email.toLowerCase()),
    );
  }

  private async notifyAdmins(subject: string, title: string, lines: string[]) {
    const admins = this.adminEmails();
    if (!admins.length) {
      this.logger.warn(
        'ADMIN_EMAIL is not set; a release case has no reviewer.',
      );
      return;
    }
    const url = getEmailAppLink('adminReview', {}, this.config);
    const html = wrapInEmailLayout({
      title,
      preheader: lines[0],
      contentHtml:
        lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('') +
        renderCtaButton({ url, label: 'Open release reviews' }),
    });
    const text = wrapInPlainTextLayout({
      title,
      bodyText: `${lines.join('\n\n')}\n\nOpen release reviews: ${url}`,
    });
    await Promise.all(
      admins.map((to) =>
        this.mailService.sendMail({ to, subject, html, text }).catch(() => {
          this.logger.warn('An admin release notification could not be sent.');
        }),
      ),
    );
  }

  private async sendSecurityNotice(
    user: User,
    alertTitle: string,
    alertDescription: string,
  ) {
    await this.notificationsService
      .sendTemplatedEmail({
        to: user.email,
        userId: user.id,
        templateType: EmailTemplateType.SECURITY_ALERT,
        data: {
          recipientName: user.name,
          alertTitle,
          alertDescription,
          eventTime: new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }),
          reviewActivityUrl: getEmailAppLink('home', {}, this.config),
        },
      })
      .catch(() =>
        this.logger.warn('An owner release notice could not be sent.'),
      );
  }

  // -----------------------------------------------------------------
  // Invitations
  // -----------------------------------------------------------------

  /** Emails the trusted person and marks them INVITED. Safe to repeat. */
  async sendInvitation(owner: User, recipient: Recipient) {
    if (recipient.status === RecipientStatus.REVOKED)
      throw new BadRequestException(
        'This person was removed. Add them again to invite them.',
      );
    await this.notificationsService.sendTemplatedEmail({
      to: recipient.email,
      templateType: EmailTemplateType.TRUSTED_PERSON_INVITATION,
      data: {
        recipientName: recipient.name,
        ownerName: owner.name,
        relationship: recipient.relationship ?? undefined,
        invitationUrl: getEmailAppLink('download', {}, this.config),
      },
    });
    if (recipient.status === RecipientStatus.PRIVATE) {
      recipient.status = RecipientStatus.INVITED;
      await this.recipientRepository.save(recipient);
    }
    await this.auditService.log({
      actorId: owner.id,
      action: 'recipient_invited',
      targetType: 'recipient',
      targetId: recipient.id,
      result: AuditResult.SUCCESS,
    });
    return recipient;
  }

  async inviteRecipient(ownerId: string, recipientId: string) {
    const [owner, recipient] = await Promise.all([
      this.usersService.findById(ownerId),
      this.recipientRepository.findOne({
        where: { id: recipientId, userId: ownerId },
      }),
    ]);
    if (!owner || !recipient)
      throw new NotFoundException('Recipient not found');
    return this.sendInvitation(owner, recipient);
  }

  // -----------------------------------------------------------------
  // Opening and closing cases
  // -----------------------------------------------------------------

  parseEvidence(value: string | null): CaseEvidence {
    if (!value) return { statements: [] };
    try {
      const parsed = JSON.parse(value) as Partial<CaseEvidence>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
        return {
          ...parsed,
          statements: Array.isArray(parsed.statements) ? parsed.statements : [],
        };
    } catch {
      /* Older manual cases stored a plain note. */
    }
    return { note: value, statements: [] };
  }

  private async eligibleRecipients(ownerId: string) {
    const people = await this.recipientRepository.find({
      where: {
        userId: ownerId,
        status: In([
          RecipientStatus.PRIVATE,
          RecipientStatus.INVITED,
          RecipientStatus.ACTIVE,
        ]),
      },
    });
    const counts = await this.legacyItemsService.countAssignedToRecipients(
      people.map((person) => person.id),
    );
    return people
      .map((person) => ({ person, itemCount: counts.get(person.id) ?? 0 }))
      .filter((entry) => entry.itemCount > 0);
  }

  /**
   * Called by the check-in monitor once the owner has missed enough check-ins.
   * Returns null when nothing should happen (a case is already live, or no
   * trusted person has items assigned).
   */
  async openEscalationCase(
    ownerId: string,
    evidence: { overdueDays: number; dueAt: Date; lastCheckInAt: Date | null },
  ) {
    const live = await this.caseRepository.findOne({
      where: { userId: ownerId, status: In(LIVE_CASE_STATUSES) },
    });
    if (live) return null;
    const owner = await this.usersService.findById(ownerId);
    if (!owner || owner.status !== UserStatus.ACTIVE) return null;
    const recipients = await this.eligibleRecipients(ownerId);
    if (!recipients.length) {
      this.logger.log(
        'Escalation skipped: no trusted person has items assigned.',
      );
      return null;
    }

    const releaseCase = await this.caseRepository.save(
      this.caseRepository.create({
        userId: ownerId,
        reason: ReleaseReason.CHECK_IN_ESCALATION,
        status: ReleaseCaseStatus.OPEN,
        openedAt: new Date(),
        evidence: JSON.stringify({
          overdueDays: evidence.overdueDays,
          dueAt: evidence.dueAt.toISOString(),
          lastCheckInAt: evidence.lastCheckInAt?.toISOString() ?? null,
          statements: [],
        } satisfies CaseEvidence),
      }),
    );
    await this.auditService.log({
      actorId: null,
      action: 'release_case_opened',
      targetType: 'release_case',
      targetId: releaseCase.id,
      result: AuditResult.SUCCESS,
      metadata: {
        overdueDays: evidence.overdueDays,
        recipients: recipients.length,
      },
    });

    const deadline = new Date(Date.now() + STATEMENT_WINDOW_DAYS * DAY_MS);
    for (const { person } of recipients) {
      try {
        // People the owner chose to tell "on activation" hear about Virasat now.
        if (person.status === RecipientStatus.PRIVATE)
          await this.sendInvitation(owner, person);
        await this.notificationsService.sendTemplatedEmail({
          to: person.email,
          templateType: EmailTemplateType.RELEASE_CASE_OPENED,
          data: {
            verifierName: person.name,
            ownerName: owner.name,
            caseId: releaseCase.id,
            triggerReason: `${owner.name} has not checked in for ${evidence.overdueDays} days, despite repeated reminders.`,
            openedAt: formatDate(new Date()),
            verificationUrl: getEmailAppLink('shared', {}, this.config),
            verificationDeadline: formatDate(deadline),
          },
        });
      } catch {
        this.logger.warn(
          'A trusted person could not be told about a release case.',
        );
      }
    }
    await this.sendSecurityNotice(
      owner,
      'We could not reach you',
      `You have not checked in for ${evidence.overdueDays} days, so we have started a release review and contacted your trusted people. Nothing is released until Virasat approves it. Open Virasat and check in to cancel the review.`,
    );
    await this.notifyAdmins(
      'Release review needed',
      'A release case needs review',
      [
        `An owner has not checked in for ${evidence.overdueDays} days.`,
        `Case ${releaseCase.id} was opened and ${recipients.length} trusted ${recipients.length === 1 ? 'person was' : 'people were'} contacted.`,
      ],
    );
    return releaseCase;
  }

  /**
   * The owner is alive and active: close any live case and revoke access.
   * Called after every successful check-in.
   */
  async onOwnerCheckedIn(ownerId: string) {
    const cases = await this.caseRepository.find({
      where: { userId: ownerId, status: In(LIVE_CASE_STATUSES) },
    });
    if (!cases.length) return { closedCases: 0, revokedAuthorizations: 0 };
    const now = new Date();
    const authorizations = await this.authorizationRepository.find({
      where: {
        caseId: In(cases.map((c) => c.id)),
        status: AuthorizationStatus.ACTIVE,
      },
    });
    for (const authorization of authorizations) {
      authorization.status = AuthorizationStatus.REVOKED;
      authorization.revokedAt = now;
    }
    if (authorizations.length)
      await this.authorizationRepository.save(authorizations);
    for (const releaseCase of cases) {
      releaseCase.status = ReleaseCaseStatus.CLOSED;
      releaseCase.closedAt = now;
      releaseCase.reviewerNotes = [
        releaseCase.reviewerNotes,
        'Closed automatically: the owner checked in.',
      ]
        .filter(Boolean)
        .join('\n');
    }
    await this.caseRepository.save(cases);
    await this.auditService.log({
      actorId: ownerId,
      action: 'release_cancelled_by_check_in',
      targetType: 'release_case',
      targetId: cases[0].id,
      result: AuditResult.SUCCESS,
      metadata: {
        closedCases: cases.length,
        revokedAuthorizations: authorizations.length,
      },
    });
    await this.notifyAdmins('Release case closed', 'The owner checked in', [
      `The owner of case ${cases.map((c) => c.id).join(', ')} checked in, so the case was closed${authorizations.length ? ' and released access was revoked' : ''}.`,
    ]);
    return {
      closedCases: cases.length,
      revokedAuthorizations: authorizations.length,
    };
  }

  /** The owner's own view: is a review running because they went quiet? */
  async liveCaseForOwner(ownerId: string) {
    const releaseCase = await this.caseRepository.findOne({
      where: { userId: ownerId, status: In(LIVE_CASE_STATUSES) },
      order: { createdAt: 'DESC' },
    });
    return releaseCase
      ? {
          id: releaseCase.id,
          status: releaseCase.status,
          openedAt: releaseCase.openedAt,
        }
      : null;
  }

  // -----------------------------------------------------------------
  // Trusted-person side
  // -----------------------------------------------------------------

  private async verifiedUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.emailVerified)
      throw new ForbiddenException(
        'Verify your email address to see what was shared with you.',
      );
    return user;
  }

  /** Recipient rows (across all owners) that belong to this signed-in user. */
  private async recipientRowsFor(user: User) {
    return (
      this.recipientRepository
        .createQueryBuilder('recipient')
        .where('LOWER(recipient.email) = LOWER(:email)', { email: user.email })
        .andWhere('recipient.status IN (:...statuses)', {
          statuses: [RecipientStatus.INVITED, RecipientStatus.ACTIVE],
        })
        // Nobody can be their own trusted person.
        .andWhere('recipient.userId != :userId', { userId: user.id })
        .getMany()
    );
  }

  private async activeAuthorizations(recipientIds: string[]) {
    if (!recipientIds.length) return [];
    const now = new Date();
    const authorizations = await this.authorizationRepository.find({
      where: {
        recipientId: In(recipientIds),
        status: AuthorizationStatus.ACTIVE,
      },
      relations: { releaseCase: true },
    });
    const live = authorizations.filter(
      (a) =>
        new Date(a.expiresAt).getTime() > now.getTime() &&
        a.releaseCase?.status === ReleaseCaseStatus.APPROVED,
    );
    // Defense in depth: an owner who checked in after the case opened is
    // alive, even if revoking on check-in failed. Their release is void.
    const lastCheckIn = new Map<string, number>();
    for (const ownerId of new Set(live.map((a) => a.releaseCase.userId))) {
      const latest = await this.checkInEventRepository
        .createQueryBuilder('event')
        .innerJoin('event.policy', 'policy')
        .where('policy.userId = :ownerId AND event.status = :status', {
          ownerId,
          status: CheckInEventStatus.COMPLETED,
        })
        .orderBy('event.respondedAt', 'DESC')
        .getOne();
      lastCheckIn.set(
        ownerId,
        latest?.respondedAt ? new Date(latest.respondedAt).getTime() : 0,
      );
    }
    return live.filter(
      (a) =>
        (lastCheckIn.get(a.releaseCase.userId) ?? 0) <
        new Date(a.releaseCase.createdAt).getTime(),
    );
  }

  async overview(userId: string) {
    const user = await this.verifiedUser(userId);
    const rows = await this.recipientRowsFor(user);
    const owners = new Map<string, User | null>();
    for (const ownerId of new Set(rows.map((row) => row.userId)))
      owners.set(ownerId, await this.usersService.findById(ownerId));
    const ownerName = (ownerId: string) =>
      owners.get(ownerId)?.name ?? 'Someone';

    const cases = rows.length
      ? await this.caseRepository.find({
          where: {
            userId: In([...owners.keys()]),
            status: In([
              ReleaseCaseStatus.OPEN,
              ReleaseCaseStatus.UNDER_REVIEW,
            ]),
          },
        })
      : [];
    const authorizations = await this.activeAuthorizations(
      rows.map((row) => row.id),
    );

    return {
      invitations: rows
        .filter((row) => row.status === RecipientStatus.INVITED)
        .map((row) => ({
          recipientId: row.id,
          ownerName: ownerName(row.userId),
          relationship: row.relationship,
        })),
      cases: cases.flatMap((releaseCase) => {
        const mine = rows.find((row) => row.userId === releaseCase.userId);
        if (!mine) return [];
        const statement = this.parseEvidence(
          releaseCase.evidence,
        ).statements.find((entry) => entry.recipientId === mine.id);
        return [
          {
            caseId: releaseCase.id,
            ownerName: ownerName(releaseCase.userId),
            status: releaseCase.status,
            openedAt: releaseCase.openedAt,
            statementSubmittedAt: statement?.submittedAt ?? null,
          },
        ];
      }),
      releases: authorizations.map((authorization) => {
        const row = rows.find((r) => r.id === authorization.recipientId)!;
        return {
          caseId: authorization.caseId,
          ownerName: ownerName(row.userId),
          expiresAt: authorization.expiresAt,
        };
      }),
    };
  }

  async respondToInvitation(
    userId: string,
    recipientId: string,
    accept: boolean,
  ) {
    const user = await this.verifiedUser(userId);
    const row = (await this.recipientRowsFor(user)).find(
      (r) => r.id === recipientId,
    );
    if (!row) throw new NotFoundException('Invitation not found');
    if (accept) {
      row.status = RecipientStatus.ACTIVE;
      row.acceptedAt = row.acceptedAt ?? new Date();
    } else {
      row.status = RecipientStatus.REVOKED;
      row.revokedAt = new Date();
    }
    await this.recipientRepository.save(row);
    await this.auditService.log({
      actorId: user.id,
      action: accept ? 'invitation_accepted' : 'invitation_declined',
      targetType: 'recipient',
      targetId: row.id,
      result: AuditResult.SUCCESS,
    });
    return { recipientId: row.id, status: row.status };
  }

  async submitStatement(userId: string, caseId: string, text: string) {
    const statement = text?.trim();
    if (!statement || statement.length > MAX_STATEMENT_LENGTH)
      throw new BadRequestException(
        `Write between 1 and ${MAX_STATEMENT_LENGTH} characters.`,
      );
    const user = await this.verifiedUser(userId);
    const releaseCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    const rows = await this.recipientRowsFor(user);
    const mine =
      releaseCase && rows.find((row) => row.userId === releaseCase.userId);
    if (!releaseCase || !mine)
      throw new NotFoundException('Release case not found');
    if (
      ![ReleaseCaseStatus.OPEN, ReleaseCaseStatus.UNDER_REVIEW].includes(
        releaseCase.status,
      )
    )
      throw new BadRequestException(
        'This release case is no longer accepting statements.',
      );

    // Responding to a case counts as accepting the trusted-person role.
    if (mine.status === RecipientStatus.INVITED) {
      mine.status = RecipientStatus.ACTIVE;
      mine.acceptedAt = new Date();
      await this.recipientRepository.save(mine);
    }
    const evidence = this.parseEvidence(releaseCase.evidence);
    evidence.statements = [
      ...evidence.statements.filter((entry) => entry.recipientId !== mine.id),
      {
        recipientId: mine.id,
        text: statement,
        submittedAt: new Date().toISOString(),
      },
    ];
    releaseCase.evidence = JSON.stringify(evidence);
    releaseCase.status = ReleaseCaseStatus.UNDER_REVIEW;
    await this.caseRepository.save(releaseCase);
    await this.auditService.log({
      actorId: user.id,
      action: 'release_statement_submitted',
      targetType: 'release_case',
      targetId: releaseCase.id,
      result: AuditResult.SUCCESS,
    });
    await this.notifyAdmins(
      'Release statement received',
      'A trusted person responded',
      [
        `A trusted person sent a statement for case ${releaseCase.id}. It is ready for review.`,
      ],
    );
    return { caseId: releaseCase.id, status: releaseCase.status };
  }

  /** Recipient ids this user may read items for, optionally for one case. */
  private async authorizedRecipientIds(userId: string, caseId?: string) {
    const user = await this.verifiedUser(userId);
    const rows = await this.recipientRowsFor(user);
    const authorizations = await this.activeAuthorizations(
      rows.map((row) => row.id),
    );
    return authorizations
      .filter((a) => !caseId || a.caseId === caseId)
      .map((a) => a.recipientId);
  }

  private async auditAccess(
    userId: string,
    action: string,
    itemId: string | null,
    allowed: boolean,
  ) {
    await this.auditService.log({
      actorId: userId,
      action,
      targetType: 'legacy_item',
      targetId: itemId,
      result: allowed ? AuditResult.SUCCESS : AuditResult.DENIED,
    });
  }

  async releasedItems(userId: string, caseId: string) {
    const ids = await this.authorizedRecipientIds(userId, caseId);
    if (!ids.length) {
      await this.auditAccess(userId, 'released_items_listed', null, false);
      throw new ForbiddenException(
        'Nothing has been released to you for this case.',
      );
    }
    await this.auditAccess(userId, 'released_items_listed', null, true);
    return this.legacyItemsService.listAssignedToRecipients(ids);
  }

  private async guarded<T>(
    userId: string,
    itemId: string,
    action: string,
    read: (ids: string[]) => Promise<T>,
  ) {
    const ids = await this.authorizedRecipientIds(userId);
    try {
      const result = await read(ids);
      await this.auditAccess(userId, action, itemId, true);
      return result;
    } catch (error) {
      await this.auditAccess(userId, action, itemId, false);
      throw error;
    }
  }

  releasedItem(userId: string, itemId: string) {
    return this.guarded(userId, itemId, 'released_item_viewed', (ids) =>
      this.legacyItemsService.releasedDetail(itemId, ids),
    );
  }

  releasedFile(userId: string, itemId: string) {
    return this.guarded(userId, itemId, 'released_file_downloaded', (ids) =>
      this.legacyItemsService.releasedFile(itemId, ids),
    );
  }

  releasedThumbnail(userId: string, itemId: string) {
    return this.guarded(userId, itemId, 'released_preview_viewed', (ids) =>
      this.legacyItemsService.releasedThumbnail(itemId, ids),
    );
  }

  // -----------------------------------------------------------------
  // Admin review
  // -----------------------------------------------------------------

  async assertAdmin(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!this.isAdmin(user))
      throw new ForbiddenException(
        'Release reviews are for Virasat reviewers only.',
      );
    return user!;
  }

  async adminListCases(userId: string, status?: ReleaseCaseStatus) {
    await this.assertAdmin(userId);
    const cases = await this.caseRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return Promise.all(
      cases.map(async (releaseCase) => {
        const owner = await this.usersService.findById(releaseCase.userId);
        return {
          id: releaseCase.id,
          status: releaseCase.status,
          reason: releaseCase.reason,
          openedAt: releaseCase.openedAt,
          ownerName: owner?.name ?? 'Deleted account',
          statementCount: this.parseEvidence(releaseCase.evidence).statements
            .length,
        };
      }),
    );
  }

  async adminCaseDetail(userId: string, caseId: string) {
    await this.assertAdmin(userId);
    const releaseCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!releaseCase) throw new NotFoundException('Release case not found');
    const owner = await this.usersService.findById(releaseCase.userId);
    const evidence = this.parseEvidence(releaseCase.evidence);
    const people = await this.recipientRepository.find({
      where: { userId: releaseCase.userId },
    });
    const counts = await this.legacyItemsService.countAssignedToRecipients(
      people.map((p) => p.id),
    );
    const authorizations = await this.authorizationRepository.find({
      where: { caseId },
    });
    // Reviewers see who and why, never vault contents.
    return {
      id: releaseCase.id,
      status: releaseCase.status,
      reason: releaseCase.reason,
      openedAt: releaseCase.openedAt,
      reviewedAt: releaseCase.reviewedAt,
      closedAt: releaseCase.closedAt,
      reviewerNotes: releaseCase.reviewerNotes,
      owner: owner ? { name: owner.name, email: owner.email } : null,
      overdueDays: evidence.overdueDays ?? null,
      dueAt: evidence.dueAt ?? null,
      lastCheckInAt: evidence.lastCheckInAt ?? null,
      note: evidence.note ?? null,
      recipients: people
        .filter((p) => p.status !== RecipientStatus.REVOKED)
        .map((person) => {
          const statement = evidence.statements.find(
            (s) => s.recipientId === person.id,
          );
          return {
            id: person.id,
            name: person.name,
            email: person.email,
            relationship: person.relationship,
            status: person.status,
            verificationRequired: person.verificationRequired,
            assignedItems: counts.get(person.id) ?? 0,
            statement: statement?.text ?? null,
            statementSubmittedAt: statement?.submittedAt ?? null,
            authorized: authorizations.some(
              (a) =>
                a.recipientId === person.id &&
                a.status === AuthorizationStatus.ACTIVE,
            ),
          };
        }),
    };
  }

  async approveCase(adminId: string, caseId: string, notes: string) {
    const admin = await this.assertAdmin(adminId);
    const releaseCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!releaseCase) throw new NotFoundException('Release case not found');
    if (releaseCase.userId === admin.id)
      throw new ForbiddenException(
        'You cannot review a release of your own vault.',
      );
    if (
      ![ReleaseCaseStatus.OPEN, ReleaseCaseStatus.UNDER_REVIEW].includes(
        releaseCase.status,
      )
    )
      throw new BadRequestException('Only open cases can be approved.');
    const evidence = this.parseEvidence(releaseCase.evidence);
    const eligible = (await this.eligibleRecipients(releaseCase.userId)).filter(
      ({ person }) =>
        // People the owner marked "verification required" must have confirmed who they are.
        !person.verificationRequired ||
        evidence.statements.some((s) => s.recipientId === person.id),
    );
    if (!eligible.length)
      throw new BadRequestException(
        'No trusted person can receive items yet. Wait for a statement from each person who must verify their identity.',
      );

    const expiresAt = new Date(Date.now() + ACCESS_DAYS * DAY_MS);
    await this.authorizationRepository.save(
      eligible.map(({ person }) =>
        this.authorizationRepository.create({
          caseId,
          recipientId: person.id,
          approvedBy: admin.id,
          status: AuthorizationStatus.ACTIVE,
          expiresAt,
          scope: { type: 'FULL_VAULT' },
        }),
      ),
    );
    releaseCase.status = ReleaseCaseStatus.APPROVED;
    releaseCase.reviewerId = admin.id;
    releaseCase.reviewerNotes = notes?.trim() || null;
    releaseCase.reviewedAt = new Date();
    await this.caseRepository.save(releaseCase);
    await this.auditService.log({
      actorId: admin.id,
      action: 'release_approved',
      targetType: 'release_case',
      targetId: caseId,
      result: AuditResult.SUCCESS,
      metadata: { recipients: eligible.map(({ person }) => person.id) },
    });

    const owner = await this.usersService.findById(releaseCase.userId);
    for (const { person, itemCount } of eligible) {
      await this.notificationsService
        .sendTemplatedEmail({
          to: person.email,
          templateType: EmailTemplateType.RELEASE_AUTHORIZED,
          data: {
            recipientName: person.name,
            ownerName: owner?.name ?? 'Your loved one',
            releaseId: caseId,
            accessUrl: getEmailAppLink('shared', {}, this.config),
            accessExpiryDays: ACCESS_DAYS,
            itemCountSummary: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
          },
        })
        .catch(() =>
          this.logger.warn('A release approval email could not be sent.'),
        );
    }
    if (owner)
      await this.sendSecurityNotice(
        owner,
        'Your items were released',
        'Virasat approved the release of the items you assigned to your trusted people. If you can read this, open Virasat and check in: that cancels the release and removes their access immediately.',
      );
    return this.adminCaseDetail(adminId, caseId);
  }

  async rejectCase(adminId: string, caseId: string, notes: string) {
    const admin = await this.assertAdmin(adminId);
    const releaseCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });
    if (!releaseCase) throw new NotFoundException('Release case not found');
    if (
      ![ReleaseCaseStatus.OPEN, ReleaseCaseStatus.UNDER_REVIEW].includes(
        releaseCase.status,
      )
    )
      throw new BadRequestException('Only open cases can be rejected.');
    releaseCase.status = ReleaseCaseStatus.REJECTED;
    releaseCase.reviewerId = admin.id;
    releaseCase.reviewerNotes = notes?.trim() || null;
    releaseCase.reviewedAt = new Date();
    releaseCase.closedAt = new Date();
    await this.caseRepository.save(releaseCase);
    await this.auditService.log({
      actorId: admin.id,
      action: 'release_rejected',
      targetType: 'release_case',
      targetId: caseId,
      result: AuditResult.SUCCESS,
    });
    return this.adminCaseDetail(adminId, caseId);
  }
}
