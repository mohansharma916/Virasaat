import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { EmailTemplateType } from '../notification/email/email-template.types';
import { getEmailAppLink } from '../notification/email/email-links';
import { NotificationsService } from '../notification/notifications.service';
import {
  ReleaseCase,
  ReleaseCaseStatus,
} from '../release/entities/release-case.entity';
import {
  ReleasePolicy,
  ReleaseTrigger,
} from '../release/entities/release-policy.entity';
import { ReleaseFlowService } from '../release/release-flow.service';
import { UsersService } from '../users/users.service';
import {
  CheckInCadence,
  CheckInPolicy,
} from './entities/check-in-policy.entity';
import {
  CheckInEvent,
  CheckInEventStatus,
} from './entities/check-in-event.entity';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A check-in counts as missed this long after it was due. */
export const MISSED_AFTER_HOURS = 72;
/** After a miss, the next check-in is due this soon instead of a full cycle. */
export const FOLLOW_UP_DAYS = 7;
export const DEFAULT_MISSES_BEFORE_REVIEW = 3;
const BATCH = 500;
// Only one API instance runs a pass at a time.
const MONITOR_LOCK_KEY = 4_202_610;

/**
 * Sends check-in reminders, records missed check-ins and, after the owner's
 * chosen number of misses, opens a release review. Every step is idempotent:
 * a pass can be repeated or interrupted without sending duplicates.
 *
 * Email is the only channel today. `reminderConfig.channels` is kept per
 * owner so phone calls (and in-person visits) can be added as channels later.
 */
@Injectable()
export class CheckInMonitorService {
  private readonly logger = new Logger(CheckInMonitorService.name);
  private running = false;

  constructor(
    @InjectRepository(CheckInEvent)
    private readonly eventRepository: Repository<CheckInEvent>,
    @InjectRepository(CheckInPolicy)
    private readonly policyRepository: Repository<CheckInPolicy>,
    @InjectRepository(ReleasePolicy)
    private readonly releasePolicyRepository: Repository<ReleasePolicy>,
    @InjectRepository(ReleaseCase)
    private readonly caseRepository: Repository<ReleaseCase>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    @Optional() private readonly releaseFlow?: ReleaseFlowService,
  ) {}

  @Cron('0 */10 * * * *')
  async scheduledPass() {
    if (this.running || process.env.CHECK_IN_MONITOR === 'off') return;
    this.running = true;
    try {
      const [{ locked }] = await this.eventRepository.query(
        'SELECT pg_try_advisory_lock($1) AS locked',
        [MONITOR_LOCK_KEY],
      );
      if (!locked) return;
      try {
        await this.runOnce();
      } finally {
        await this.eventRepository.query('SELECT pg_advisory_unlock($1)', [
          MONITOR_LOCK_KEY,
        ]);
      }
    } catch (error) {
      this.logger.error(
        `Check-in monitor pass failed: ${(error as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }

  /** One pass over every pending check-in that needs attention. */
  async runOnce(now = new Date()) {
    // Reminders start at most 7 days before a check-in is due.
    const horizon = new Date(now.getTime() + 7 * DAY_MS);
    const events = await this.eventRepository.find({
      where: {
        status: CheckInEventStatus.PENDING,
        dueAt: LessThanOrEqual(horizon),
      },
      relations: { policy: true },
      order: { dueAt: 'ASC' },
      take: BATCH,
    });
    let reminded = 0;
    let missed = 0;
    for (const event of events) {
      try {
        if (
          now.getTime() >=
          new Date(event.dueAt).getTime() + MISSED_AFTER_HOURS * 3600_000
        ) {
          await this.markMissed(event, now);
          missed++;
        } else if (await this.remind(event, now)) {
          reminded++;
        }
      } catch (error) {
        this.logger.warn(
          `Check-in ${event.id} could not be processed: ${(error as Error).message}`,
        );
      }
    }
    return { checked: events.length, reminded, missed };
  }

  private thresholds(policy: CheckInPolicy) {
    const configured = (
      policy.reminderConfig?.reminderDaysBefore ?? [3, 1]
    ).filter((days) => Number.isFinite(days) && days >= 0 && days <= 7);
    // Always include a reminder on the day itself.
    return [...new Set([...configured, 0])].sort((a, b) => b - a);
  }

  private async remind(event: CheckInEvent, now: Date) {
    const policy = event.policy;
    if (
      !policy ||
      !(policy.reminderConfig?.channels ?? ['EMAIL']).includes('EMAIL')
    )
      return false;
    const due = new Date(event.dueAt);
    const crossed = this.thresholds(policy).filter(
      (days) => now.getTime() >= due.getTime() - days * DAY_MS,
    ).length;
    if (crossed <= event.reminderCount) return false;
    // Record first, so a crash after sending cannot cause a duplicate.
    const updated = await this.eventRepository.update(
      {
        id: event.id,
        status: CheckInEventStatus.PENDING,
        reminderCount: event.reminderCount,
      },
      { reminderCount: crossed },
    );
    if (!updated.affected) return false;
    const user = await this.usersService.findById(policy.userId);
    if (!user) return false;
    await this.notificationsService.sendTemplatedEmail({
      to: user.email,
      userId: user.id,
      templateType: EmailTemplateType.CHECK_IN_REMINDER,
      data: {
        recipientName: user.name,
        daysRemaining: Math.max(
          0,
          Math.ceil((due.getTime() - now.getTime()) / DAY_MS),
        ),
        dueDate: due.toLocaleDateString('en-IN', {
          dateStyle: 'long',
          timeZone: policy.timezone || 'Asia/Kolkata',
        }),
        preferredTime: policy.preferredTime,
        cadence:
          policy.cadence === CheckInCadence.WEEKLY ? 'Weekly' : 'Monthly',
        checkInUrl: getEmailAppLink('home'),
      },
    });
    return true;
  }

  private async markMissed(event: CheckInEvent, now: Date) {
    const result = await this.policyRepository.manager.transaction(
      async (manager) => {
        const policies = manager.getRepository(CheckInPolicy);
        const events = manager.getRepository(CheckInEvent);
        const policy = await policies.findOne({
          where: { id: event.policyId },
          lock: { mode: 'pessimistic_write' },
        });
        const current = await events.findOne({ where: { id: event.id } });
        // Another pass or a check-in got here first.
        if (!policy || current?.status !== CheckInEventStatus.PENDING)
          return null;
        current.status = CheckInEventStatus.MISSED;
        await events.save(current);
        const nextDue = new Date(now.getTime() + FOLLOW_UP_DAYS * DAY_MS);
        policy.nextCheckInAt = nextDue;
        await policies.save(policy);
        await events.save(
          events.create({
            policyId: policy.id,
            dueAt: nextDue,
            status: CheckInEventStatus.PENDING,
          }),
        );
        return { policy, event: current, nextDue };
      },
    );
    if (!result) return;
    const { policy, nextDue } = result;
    const user = await this.usersService.findById(policy.userId);
    if (!user) return;

    const lastCompleted = await this.eventRepository.findOne({
      where: { policyId: policy.id, status: CheckInEventStatus.COMPLETED },
      order: { dueAt: 'DESC' },
    });
    const lastRejected = await this.caseRepository.findOne({
      where: { userId: policy.userId, status: ReleaseCaseStatus.REJECTED },
      order: { updatedAt: 'DESC' },
    });
    // Misses count from the last check-in, and restart after a rejected review.
    const since = [lastCompleted?.respondedAt, lastRejected?.updatedAt]
      .filter((d): d is Date => Boolean(d))
      .map((d) => new Date(d).getTime());
    const consecutive = await this.eventRepository.count({
      where: {
        policyId: policy.id,
        status: In([CheckInEventStatus.MISSED, CheckInEventStatus.ESCALATED]),
        ...(since.length
          ? { dueAt: MoreThan(new Date(Math.max(...since))) }
          : {}),
      },
    });

    const releasePolicy = await this.releasePolicyRepository.findOne({
      where: { userId: policy.userId },
    });
    const threshold = Number(
      releasePolicy?.escalationConfig?.missedCheckInsBeforeReview ??
        DEFAULT_MISSES_BEFORE_REVIEW,
    );
    const willEscalate =
      Boolean(this.releaseFlow) &&
      Boolean(releasePolicy?.enabled) &&
      releasePolicy?.trigger === ReleaseTrigger.CHECK_IN_ESCALATION &&
      consecutive >= Math.max(1, threshold);

    await this.notificationsService
      .sendTemplatedEmail({
        to: user.email,
        userId: user.id,
        templateType: EmailTemplateType.CHECK_IN_MISSED,
        data: {
          recipientName: user.name,
          missedDate: new Date(event.dueAt).toLocaleDateString('en-IN', {
            dateStyle: 'long',
            timeZone: policy.timezone || 'Asia/Kolkata',
          }),
          gracePeriodDays: FOLLOW_UP_DAYS,
          gracePeriodEndDate: nextDue.toLocaleDateString('en-IN', {
            dateStyle: 'long',
            timeZone: policy.timezone || 'Asia/Kolkata',
          }),
          checkInUrl: getEmailAppLink('home'),
        },
      })
      .catch(() =>
        this.logger.warn('A missed check-in email could not be sent.'),
      );

    if (!willEscalate) return;
    const releaseCase = await this.releaseFlow!.openEscalationCase(
      policy.userId,
      {
        missedCheckIns: consecutive,
        lastCheckInAt: lastCompleted?.respondedAt ?? null,
      },
    );
    if (releaseCase)
      await this.eventRepository.update(
        { id: event.id },
        { status: CheckInEventStatus.ESCALATED, escalatedAt: now },
      );
  }
}
