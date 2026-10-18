import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

import { EmailTemplateType } from '../notification/email/email-template.types';
import { getEmailAppLink } from '../notification/email/email-links';
import { NotificationsService } from '../notification/notifications.service';
import { ReminderChannelsService } from '../notification/reminder-channels.service';
import {
  ReleasePolicy,
  ReleaseTrigger,
} from '../release/entities/release-policy.entity';
import { ReleaseFlowService } from '../release/release-flow.service';
import { UsersService } from '../users/users.service';
import {
  CHECK_IN_OPENS_DAYS_BEFORE,
  DAY_MS,
  channelsForOffset,
  checkInDeadline,
  deadlineDays,
  reminderOffsets,
} from './check-in-schedule';
import {
  CheckInCadence,
  CheckInPolicy,
} from './entities/check-in-policy.entity';
import {
  CheckInEvent,
  CheckInEventStatus,
} from './entities/check-in-event.entity';

const BATCH = 500;
// Only one API instance runs a pass at a time.
const MONITOR_LOCK_KEY = 4_202_610;

/**
 * Sends check-in reminders on the schedule in check-in-schedule.ts and opens a
 * release review when the owner's deadline passes without a check-in. Each
 * step is idempotent, so a pass can be repeated or interrupted safely.
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
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly channels: ReminderChannelsService,
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

  /** The owner's deadline in days (release rules), default 3 months. */
  async deadlineFor(userId: string) {
    const policy = await this.releasePolicyRepository.findOne({
      where: { userId },
    });
    return {
      releasePolicy: policy,
      deadline: deadlineDays(policy?.escalationConfig?.checkInDeadlineDays),
    };
  }

  /** One pass over every open check-in whose window has opened. */
  async runOnce(now = new Date()) {
    const windowOpen = new Date(
      now.getTime() + CHECK_IN_OPENS_DAYS_BEFORE * DAY_MS,
    );
    const events = await this.eventRepository.find({
      where: {
        status: CheckInEventStatus.PENDING,
        dueAt: LessThanOrEqual(windowOpen),
      },
      relations: { policy: true },
      order: { dueAt: 'ASC' },
      take: BATCH,
    });
    let reminded = 0;
    let deadlines = 0;
    for (const event of events) {
      try {
        if (!event.policy) continue;
        const { deadline, releasePolicy } = await this.deadlineFor(
          event.policy.userId,
        );
        const overdueDays =
          (now.getTime() - new Date(event.dueAt).getTime()) / DAY_MS;
        if (overdueDays >= deadline) {
          await this.deadlinePassed(event, now, Math.floor(overdueDays), releasePolicy);
          deadlines++;
        } else if (await this.remind(event, now, overdueDays, deadline)) {
          reminded++;
        }
      } catch (error) {
        this.logger.warn(
          `Check-in ${event.id} could not be processed: ${(error as Error).message}`,
        );
      }
    }
    return { checked: events.length, reminded, deadlines };
  }

  private async remind(
    event: CheckInEvent,
    now: Date,
    overdueDays: number,
    deadline: number,
  ) {
    const offsets = reminderOffsets(deadline);
    const crossed = offsets.filter((offset) => overdueDays >= offset);
    if (crossed.length <= event.reminderCount) return false;
    // Record first, so a crash after sending can never cause a duplicate.
    const updated = await this.eventRepository.update(
      {
        id: event.id,
        status: CheckInEventStatus.PENDING,
        reminderCount: event.reminderCount,
      },
      { reminderCount: crossed.length },
    );
    if (!updated.affected) return false;
    const user = await this.usersService.findById(event.policy.userId);
    if (!user) return false;

    const policy = event.policy;
    const offset = crossed[crossed.length - 1];
    const due = new Date(event.dueAt);
    const timeZone = policy.timezone || 'Asia/Kolkata';
    const date = (value: Date) =>
      value.toLocaleDateString('en-IN', { dateStyle: 'long', timeZone });
    const deadlineAt = checkInDeadline(due, deadline);
    const checkInUrl = getEmailAppLink('home');
    const overdue = offset > 0;

    await this.channels.deliver(
      { userId: user.id, phone: user.phone ?? null },
      channelsForOffset(offset),
      {
        title: overdue ? 'Your Virasat check-in is overdue' : 'Time to check in',
        body: overdue
          ? `You have not checked in for ${Math.floor(overdueDays)} days. Open Virasat and check in before ${date(deadlineAt)}, or a release review will start.`
          : `Your Virasat check-in is due ${date(due)}. Open the app to check in.`,
        sendEmail: () =>
          overdue
            ? this.notificationsService.sendTemplatedEmail({
                to: user.email,
                userId: user.id,
                templateType: EmailTemplateType.CHECK_IN_MISSED,
                data: {
                  recipientName: user.name,
                  missedDate: date(due),
                  gracePeriodDays: Math.max(
                    1,
                    Math.ceil(deadline - overdueDays),
                  ),
                  gracePeriodEndDate: date(deadlineAt),
                  checkInUrl,
                },
              })
            : this.notificationsService.sendTemplatedEmail({
                to: user.email,
                userId: user.id,
                templateType: EmailTemplateType.CHECK_IN_REMINDER,
                data: {
                  recipientName: user.name,
                  daysRemaining: Math.max(0, Math.ceil(-overdueDays)),
                  dueDate: date(due),
                  preferredTime: policy.preferredTime,
                  cadence:
                    policy.cadence === CheckInCadence.WEEKLY
                      ? 'Weekly'
                      : 'Monthly',
                  checkInUrl,
                },
              }),
      },
    );
    return true;
  }

  /**
   * The deadline passed with no check-in: close this check-in, keep a new one
   * open (the owner can always still check in), and start a release review.
   */
  private async deadlinePassed(
    event: CheckInEvent,
    now: Date,
    overdueDays: number,
    releasePolicy: ReleasePolicy | null,
  ) {
    const escalate =
      Boolean(this.releaseFlow) &&
      Boolean(releasePolicy?.enabled) &&
      releasePolicy?.trigger === ReleaseTrigger.CHECK_IN_ESCALATION;
    const closed = await this.policyRepository.manager.transaction(
      async (manager) => {
        const policies = manager.getRepository(CheckInPolicy);
        const events = manager.getRepository(CheckInEvent);
        const policy = await policies.findOne({
          where: { id: event.policyId },
          lock: { mode: 'pessimistic_write' },
        });
        const current = await events.findOne({ where: { id: event.id } });
        // A check-in or another pass got here first.
        if (!policy || current?.status !== CheckInEventStatus.PENDING)
          return null;
        current.status = CheckInEventStatus.MISSED;
        await events.save(current);
        policy.nextCheckInAt = now;
        await policies.save(policy);
        await events.save(
          events.create({
            policyId: policy.id,
            dueAt: now,
            status: CheckInEventStatus.PENDING,
          }),
        );
        return policy;
      },
    );
    if (!closed || !escalate) return;

    const lastCompleted = await this.eventRepository.findOne({
      where: { policyId: closed.id, status: CheckInEventStatus.COMPLETED },
      order: { dueAt: 'DESC' },
    });
    const releaseCase = await this.releaseFlow!.openEscalationCase(
      closed.userId,
      {
        overdueDays,
        dueAt: new Date(event.dueAt),
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
