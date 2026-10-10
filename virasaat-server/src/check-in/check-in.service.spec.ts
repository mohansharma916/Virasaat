jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { AuditEvent } from '../audit/entities/audit-event.entity';
import { CheckInService } from './check-in.service';
import {
  CheckInPolicy,
  CheckInCadence,
} from './entities/check-in-policy.entity';
import {
  CheckInEvent,
  CheckInEventStatus,
} from './entities/check-in-event.entity';

describe('check-in settings and confirmation', () => {
  const fixture = () => {
    const policy = {
      id: 'policy',
      userId: 'owner',
      cadence: CheckInCadence.MONTHLY,
      preferredTime: '10:00',
      timezone: 'Asia/Kolkata',
      reminderConfig: { channels: ['EMAIL'], reminderDaysBefore: [3, 1] },
      nextCheckInAt: new Date('2026-11-10T04:30:00Z'),
    };
    const event = {
      id: 'event',
      policyId: 'policy',
      dueAt: policy.nextCheckInAt,
      status: CheckInEventStatus.PENDING,
      reminderCount: 2,
      respondedAt: null as Date | null,
    };
    const policies = {
      findOne: jest.fn().mockResolvedValue(policy),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      manager: {},
    };
    const events = {
      findOne: jest.fn().mockResolvedValue(event),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const audit = { save: jest.fn().mockResolvedValue({}) };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === CheckInPolicy
          ? policies
          : entity === CheckInEvent
            ? events
            : entity === AuditEvent
              ? audit
              : undefined,
      ),
    };
    policies.manager = { transaction: (run) => run(manager) };
    const notifications = {
      sendTemplatedEmail: jest.fn().mockResolvedValue({}),
    };
    const users = {
      findById: jest
        .fn()
        .mockResolvedValue({ email: 'owner@example.test', name: 'Owner' }),
    };
    const service = new CheckInService(
      policies as never,
      events as never,
      undefined,
      notifications as never,
      users as never,
    );
    return { policy, event, policies, events, notifications, service };
  };

  afterEach(() => jest.useRealTimers());

  it('reschedules the existing pending event in the same transaction', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-10T05:00:00Z'));
    const { service, policy, event, policies, events } = fixture();
    const result = await service.updatePolicy('owner', {
      cadence: CheckInCadence.WEEKLY,
      preferredTime: '18:00',
    });
    expect(result.nextCheckInAt?.toISOString()).toBe(
      '2026-10-17T12:30:00.000Z',
    );
    expect(event.dueAt).toEqual(policy.nextCheckInAt);
    expect(event.reminderCount).toBe(0);
    expect(events.create).not.toHaveBeenCalled();
    expect(policies.findOne).toHaveBeenCalledWith({
      where: { userId: 'owner' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(events.save).toHaveBeenCalledWith(event);
  });

  it('uses the actual account email/cadence and does not resend on replay', async () => {
    const { service, policy, notifications } = fixture();
    policy.cadence = CheckInCadence.WEEKLY;
    await service.confirmCheckIn('owner', 'event');
    await service.confirmCheckIn('owner', 'event');
    expect(notifications.sendTemplatedEmail).toHaveBeenCalledTimes(1);
    expect(notifications.sendTemplatedEmail.mock.calls[0][0]).toMatchObject({
      to: 'owner@example.test',
      data: {
        recipientName: 'Owner',
        cadence: 'Weekly',
        dashboardUrl: 'virasat://home',
      },
    });
  });

  it('does not postpone a pending event when only reminder preferences are saved', async () => {
    const { service, event, events } = fixture();
    const due = new Date(event.dueAt);
    await service.updatePolicy('owner', {
      reminderConfig: { reminderDaysBefore: [1] },
    });
    expect(event.dueAt).toEqual(due);
    expect(event.reminderCount).toBe(2);
    expect(events.save).not.toHaveBeenCalled();
  });
});
