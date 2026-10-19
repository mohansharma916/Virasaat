import {
  channelsForOffset,
  deadlineDays,
  effectiveDeadlineDays,
  reminderOffsets,
} from './check-in-schedule';

describe('check-in reminder schedule', () => {
  it('follows the 3-month plan: opens, due day, 7/15/21/30/45, every 15 days, then daily', () => {
    const offsets = reminderOffsets(90);
    expect(offsets.slice(0, 7)).toEqual([-2, 0, 7, 15, 21, 30, 45]);
    expect(offsets).toContain(60);
    // Last two weeks before the 90-day deadline: every day.
    for (let day = 76; day < 90; day++) expect(offsets).toContain(day);
    expect(offsets).not.toContain(90);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it('keeps short deadlines sensible and clamps unsupported values', () => {
    expect(reminderOffsets(30)).toEqual([-2, 0, 7, 15, ...Array.from({ length: 14 }, (_, i) => 16 + i)]);
    expect(deadlineDays(5)).toBe(30);
    expect(deadlineDays(1000)).toBe(180);
    expect(deadlineDays(undefined)).toBe(90);
  });

  it('adds app notifications from two months overdue, and SMS and calls on paid plans', () => {
    expect(channelsForOffset(45, true)).toEqual(['EMAIL']);
    expect(channelsForOffset(60)).toEqual(['EMAIL', 'PUSH']);
    expect(channelsForOffset(60, true)).toEqual(['EMAIL', 'PUSH', 'SMS', 'CALL']);
  });

  it('keeps Starter on the 3-month deadline', () => {
    expect(effectiveDeadlineDays(30, false)).toBe(90);
    expect(effectiveDeadlineDays(30, true)).toBe(30);
  });
});
