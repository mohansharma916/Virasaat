import { nextCheckInAt } from './check-in-time';
import { CheckInCadence } from './entities/check-in-policy.entity';

describe('check-in calendar scheduling', () => {
  it('honors the preferred wall-clock time independently of the server timezone', () => {
    const now = new Date('2026-10-10T05:00:00Z');
    const common = { cadence: CheckInCadence.MONTHLY, preferredTime: '10:00' };
    expect(
      nextCheckInAt({ ...common, timezone: 'Asia/Kolkata' }, now).toISOString(),
    ).toBe('2026-11-10T04:30:00.000Z');
    expect(
      nextCheckInAt(
        { ...common, timezone: 'America/New_York' },
        now,
      ).toISOString(),
    ).toBe('2026-11-10T15:00:00.000Z');
  });

  it('clamps the next month to its last calendar day', () => {
    expect(
      nextCheckInAt(
        {
          cadence: CheckInCadence.MONTHLY,
          preferredTime: '10:00',
          timezone: 'UTC',
        },
        new Date('2026-01-31T12:00:00Z'),
      ).toISOString(),
    ).toBe('2026-02-28T10:00:00.000Z');
  });

  it('moves a nonexistent DST time forward and picks the earlier repeated time', () => {
    const policy = {
      cadence: CheckInCadence.WEEKLY,
      preferredTime: '02:30',
      timezone: 'America/New_York',
    };
    expect(
      nextCheckInAt(policy, new Date('2026-03-01T15:00:00Z')).toISOString(),
    ).toBe('2026-03-08T07:30:00.000Z');
    expect(
      nextCheckInAt(
        { ...policy, preferredTime: '01:30' },
        new Date('2026-10-25T15:00:00Z'),
      ).toISOString(),
    ).toBe('2026-11-01T05:30:00.000Z');
  });

  it('rejects invalid zones and times instead of silently using the server clock', () => {
    expect(() =>
      nextCheckInAt({
        cadence: CheckInCadence.MONTHLY,
        preferredTime: '10:00',
        timezone: 'Invalid/Zone',
      }),
    ).toThrow('IANA timezone');
    expect(() =>
      nextCheckInAt({
        cadence: CheckInCadence.MONTHLY,
        preferredTime: '25:00',
        timezone: 'UTC',
      }),
    ).toThrow('valid check-in time');
  });
});
