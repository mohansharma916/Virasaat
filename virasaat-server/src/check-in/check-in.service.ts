import { AuditEvent, AuditResult } from '../audit/entities/audit-event.entity';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Optional } from '@nestjs/common';

import {
  CheckInCadence,
  CheckInPolicy,
} from './entities/check-in-policy.entity';
import {
  CheckInEvent,
  CheckInEventStatus,
} from './entities/check-in-event.entity';

import { UpdateCheckInDto } from './dto/update-check-in.dto';
import { PlanEntitlementService } from '../subscriptions/plan-entitlement.service';
import { Feature } from '../subscriptions/subscription.constants';
import { NotificationsService } from '../notification/notifications.service';
import { EmailTemplateType } from '../notification/email/email-template.types';
import { UsersService } from '../users/users.service';
import { getEmailAppLink } from '../notification/email/email-links';
import { nextCheckInAt } from './check-in-time';

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);
  constructor(
    @InjectRepository(CheckInPolicy)
    private readonly policyRepository: Repository<CheckInPolicy>,

    @InjectRepository(CheckInEvent)
    private readonly eventRepository: Repository<CheckInEvent>,

    @Optional()
    private readonly planEntitlementService?: PlanEntitlementService,

    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly usersService?: UsersService,
  ) {}

  /**
   * Get user's check-in configuration.
   */
  async getPolicy(userId: string) {
    const policy = await this.policyRepository.findOne({
      where: { userId },
    });

    if (!policy) {
      throw new NotFoundException('Check-in policy not configured');
    }

    return policy;
  }

  /**
   * Create or update check-in settings.
   */
  async updatePolicy(userId: string, dto: UpdateCheckInDto) {
    if (this.planEntitlementService) {
      if (dto.cadence && dto.cadence !== CheckInCadence.MONTHLY) {
        await this.planEntitlementService.assertFeature(
          userId,
          Feature.CUSTOM_CHECK_IN,
        );
      }
    }

    return this.policyRepository.manager.transaction(async (manager) => {
      const policies = manager.getRepository(CheckInPolicy);
      const events = manager.getRepository(CheckInEvent);
      let policy = await policies.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      const scheduleChanged =
        !policy ||
        (dto.cadence !== undefined && dto.cadence !== policy.cadence) ||
        (dto.preferredTime !== undefined &&
          dto.preferredTime !== policy.preferredTime) ||
        (dto.timezone !== undefined && dto.timezone !== policy.timezone);

      if (!policy) {
        policy = policies.create({
          userId,
          cadence: dto.cadence ?? CheckInCadence.MONTHLY,
          preferredTime: dto.preferredTime ?? '09:00',
          timezone: dto.timezone ?? 'Asia/Kolkata',
          reminderConfig: {
            channels: dto.reminderConfig?.channels ?? ['EMAIL'],

            reminderDaysBefore: dto.reminderConfig?.reminderDaysBefore ?? [
              3, 1,
            ],
          },
          escalationEnabled: dto.escalationEnabled ?? false,
        });
      } else {
        if (dto.cadence !== undefined) {
          policy.cadence = dto.cadence;
        }

        if (dto.preferredTime !== undefined) {
          policy.preferredTime = dto.preferredTime;
        }

        if (dto.timezone !== undefined) {
          policy.timezone = dto.timezone;
        }

        if (dto.reminderConfig !== undefined) {
          policy.reminderConfig = {
            ...policy.reminderConfig,
            ...dto.reminderConfig,
          };
        }

        if (dto.escalationEnabled !== undefined) {
          policy.escalationEnabled = dto.escalationEnabled;
        }
      }

      if (scheduleChanged || !policy.nextCheckInAt) {
        policy.nextCheckInAt = this.calculateNextCheckIn(policy);
      }

      policy = await policies.save(policy);

      // Create the first event if there isn't one.
      const existingEvent = await events.findOne({
        where: {
          policyId: policy.id,
          status: CheckInEventStatus.PENDING,
        },
      });

      if (existingEvent && policy.nextCheckInAt) {
        if (
          new Date(existingEvent.dueAt).getTime() !==
          new Date(policy.nextCheckInAt).getTime()
        ) {
          existingEvent.dueAt = policy.nextCheckInAt;
          existingEvent.reminderCount = 0;
          await events.save(existingEvent);
        }
      } else if (policy.nextCheckInAt) {
        await events.save(
          events.create({
            policyId: policy.id,
            dueAt: policy.nextCheckInAt,
            status: CheckInEventStatus.PENDING,
          }),
        );
      }

      return policy;
    });
  }

  /**
   * Confirm the user's check-in.
   */
  async confirmCheckIn(userId: string, eventId: string) {
    const result = await this.policyRepository.manager.transaction(
      async (manager) => {
        const policies = manager.getRepository(CheckInPolicy);
        const events = manager.getRepository(CheckInEvent);
        const policy = await policies.findOne({
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!policy)
          throw new NotFoundException('Check-in policy not configured');
        const event = await events.findOne({
          where: { id: eventId, policyId: policy.id },
        });
        if (!event) throw new NotFoundException('Check-in not found');
        if (event.status === CheckInEventStatus.COMPLETED)
          return {
            success: true,
            nextCheckInAt: policy.nextCheckInAt,
            respondedAt: event.respondedAt,
            newlyCompleted: false,
            cadence: policy.cadence,
            timezone: policy.timezone,
          };
        if (event.status !== CheckInEventStatus.PENDING)
          throw new BadRequestException(
            'This check-in needs a secure activity review. No release has been authorized by this request.',
          );
        event.status = CheckInEventStatus.COMPLETED;
        event.respondedAt = new Date();
        await events.save(event);
        policy.nextCheckInAt = this.calculateNextCheckIn(policy);
        await policies.save(policy);
        await events.save(
          events.create({
            policyId: policy.id,
            dueAt: policy.nextCheckInAt,
            status: CheckInEventStatus.PENDING,
          }),
        );
        await manager.getRepository(AuditEvent).save({
          actorId: userId,
          action: 'checkin_completed',
          targetType: 'check_in_event',
          targetId: event.id,
          result: AuditResult.SUCCESS,
        });
        return {
          success: true,
          nextCheckInAt: policy.nextCheckInAt,
          respondedAt: event.respondedAt,
          newlyCompleted: true,
          cadence: policy.cadence,
          timezone: policy.timezone,
        };
      },
    );

    if (
      result.newlyCompleted &&
      this.notificationsService &&
      this.usersService
    ) {
      const users = this.usersService;
      const notifications = this.notificationsService;
      void (async () => {
        const user = await users.findById(userId);
        if (user)
          await notifications.sendTemplatedEmail({
            to: user.email,
            userId,
            templateType: EmailTemplateType.CHECK_IN_CONFIRMED,
            data: {
              recipientName: user.name,
              confirmedAt: new Date(result.respondedAt!).toLocaleString(
                'en-US',
                {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: result.timezone || 'Asia/Kolkata',
                },
              ),
              nextCheckInDate: result.nextCheckInAt
                ? new Date(result.nextCheckInAt).toLocaleDateString('en-US', {
                    dateStyle: 'long',
                    timeZone: result.timezone || 'Asia/Kolkata',
                  })
                : 'Next cycle',
              cadence:
                result.cadence === CheckInCadence.WEEKLY ? 'Weekly' : 'Monthly',
              dashboardUrl: getEmailAppLink('home'),
            },
          });
      })().catch(() =>
        this.logger.warn(
          'Check-in confirmed, but its email confirmation could not be sent.',
        ),
      );
    }

    return {
      success: result.success,
      nextCheckInAt: result.nextCheckInAt,
      respondedAt: result.respondedAt,
    };
  }

  /**
   * Get check-in history.
   */
  async getHistory(userId: string) {
    const policy = await this.getPolicy(userId);

    return this.eventRepository.find({
      where: {
        policyId: policy.id,
      },
      order: {
        dueAt: 'DESC',
      },
    });
  }

  /**
   * Get current check-in status.
   */
  async getStatus(userId: string) {
    const policy = await this.getPolicy(userId);

    const latestEvent = await this.eventRepository.findOne({
      where: {
        policyId: policy.id,
      },
      order: {
        dueAt: 'DESC',
      },
    });

    return {
      policy,
      currentEvent: latestEvent,
    };
  }

  /**
   * Calculate next check-in date.
   */
  private calculateNextCheckIn(policy: CheckInPolicy): Date {
    return nextCheckInAt(policy);
  }
}
