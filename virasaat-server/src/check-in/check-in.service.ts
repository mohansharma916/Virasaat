import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CheckInCadence,
  CheckInPolicy,
} from './entities/check-in-policy.entity';

import {
  CheckInEvent,
  CheckInEventStatus,
} from './entities/check-in-event.entity';

import { UpdateCheckInDto } from './dto/update-check-in.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckInPolicy)
    private readonly policyRepository: Repository<CheckInPolicy>,

    @InjectRepository(CheckInEvent)
    private readonly eventRepository: Repository<CheckInEvent>,
  ) {}

  /**
   * Get user's check-in configuration.
   */
  async getPolicy(userId: string) {
    const policy = await this.policyRepository.findOne({
      where: { userId },
    });

    if (!policy) {
      throw new NotFoundException(
        'Check-in policy not configured',
      );
    }

    return policy;
  }

  /**
   * Create or update check-in settings.
   */
  async updatePolicy(
    userId: string,
    dto: UpdateCheckInDto,
  ) {
    let policy = await this.policyRepository.findOne({
      where: { userId },
    });

    if (!policy) {
      policy = this.policyRepository.create({
        userId,
        cadence:
          dto.cadence ?? CheckInCadence.MONTHLY,
        preferredTime:
          dto.preferredTime ?? '09:00',
        timezone:
          dto.timezone ?? 'Asia/Kolkata',
        reminderConfig: {
          channels:
            dto.reminderConfig?.channels ?? ['EMAIL'],

          reminderDaysBefore:
            dto.reminderConfig?.reminderDaysBefore ?? [3, 1],
        },
        escalationEnabled:
          dto.escalationEnabled ?? false,
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
        policy.escalationEnabled =
          dto.escalationEnabled;
      }
    }

    policy.nextCheckInAt =
      this.calculateNextCheckIn(policy);

    policy = await this.policyRepository.save(policy);

    // Create the first event if there isn't one.
    const existingEvent =
      await this.eventRepository.findOne({
        where: {
          policyId: policy.id,
          status: CheckInEventStatus.PENDING,
        },
      });

    if (!existingEvent && policy.nextCheckInAt) {
      await this.createEvent(
        policy,
        policy.nextCheckInAt,
      );
    }

    return policy;
  }

  /**
   * Confirm the user's check-in.
   */
  async confirmCheckIn(userId: string) {
    const policy = await this.getPolicy(userId);

    const event = await this.eventRepository.findOne({
      where: {
        policyId: policy.id,
        status: CheckInEventStatus.PENDING,
      },
      order: {
        dueAt: 'ASC',
      },
    });

    if (!event) {
      throw new NotFoundException(
        'No pending check-in found',
      );
    }

    event.status = CheckInEventStatus.COMPLETED;
    event.respondedAt = new Date();

    await this.eventRepository.save(event);

    const nextCheckInAt =
      this.calculateNextCheckIn(policy);

    policy.nextCheckInAt = nextCheckInAt;

    await this.policyRepository.save(policy);

    await this.createEvent(
      policy,
      nextCheckInAt,
    );

    return {
      success: true,
      message: 'Check-in completed successfully',
      respondedAt: event.respondedAt,
      nextCheckInAt,
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

    const latestEvent =
      await this.eventRepository.findOne({
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
   * Create check-in event.
   */
  private async createEvent(
    policy: CheckInPolicy,
    dueAt: Date,
  ) {
    const event = this.eventRepository.create({
      policyId: policy.id,
      dueAt,
      status: CheckInEventStatus.PENDING,
    });

    return this.eventRepository.save(event);
  }

  /**
   * Calculate next check-in date.
   */
  private calculateNextCheckIn(
    policy: CheckInPolicy,
  ): Date {
    const now = new Date();

    const [hours, minutes] =
      policy.preferredTime
        .split(':')
        .map(Number);

    const next = new Date(now);

    next.setHours(hours);
    next.setMinutes(minutes);
    next.setSeconds(0);
    next.setMilliseconds(0);

    if (policy.cadence === CheckInCadence.WEEKLY) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }
}