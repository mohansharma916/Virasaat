/**
 * The check-in schedule, in days relative to a check-in's due date.
 *
 * - Check-in opens 2 days before the due date and stays open until done.
 * - Before it is due: a reminder when it opens, and one on the day.
 * - Overdue: 7, 15, 21, 30 and 45 days after, then every 15 days, and every
 *   day during the last 2 weeks before the deadline.
 * - Deadline (default 3 months, owner-configurable): a release review opens.
 * - From 2 months overdue, reminders go out on every channel.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
export const CHECK_IN_OPENS_DAYS_BEFORE = 2;
export const DEFAULT_DEADLINE_DAYS = 90;
export const MIN_DEADLINE_DAYS = 30;
export const MAX_DEADLINE_DAYS = 180;
export const ALL_CHANNELS_AFTER_DAYS = 60;
export const DAILY_FINAL_DAYS = 14;
const OVERDUE_STEPS = [7, 15, 21, 30, 45];
const LATER_EVERY_DAYS = 15;

export type ReminderChannel = 'EMAIL' | 'PUSH' | 'SMS' | 'CALL';
export const ALL_CHANNELS: ReminderChannel[] = ['EMAIL', 'PUSH', 'SMS', 'CALL'];

/** The owner's deadline, clamped to the supported range. */
export function deadlineDays(value: unknown): number {
  const days = Number(value);
  if (!Number.isFinite(days)) return DEFAULT_DEADLINE_DAYS;
  return Math.min(MAX_DEADLINE_DAYS, Math.max(MIN_DEADLINE_DAYS, Math.round(days)));
}

/** Every reminder point for one check-in, ascending, in days from the due date. */
export function reminderOffsets(deadline: number): number[] {
  const finalStart = deadline - DAILY_FINAL_DAYS;
  const overdue = [...OVERDUE_STEPS];
  for (let day = OVERDUE_STEPS[OVERDUE_STEPS.length - 1] + LATER_EVERY_DAYS; day < finalStart; day += LATER_EVERY_DAYS)
    overdue.push(day);
  const daily: number[] = [];
  for (let day = Math.max(1, finalStart); day < deadline; day++) daily.push(day);
  return [
    ...new Set([
      -CHECK_IN_OPENS_DAYS_BEFORE,
      0,
      ...overdue.filter((day) => day < finalStart),
      ...daily,
    ]),
  ].sort((a, b) => a - b);
}

export function channelsForOffset(offsetDays: number): ReminderChannel[] {
  return offsetDays >= ALL_CHANNELS_AFTER_DAYS ? ALL_CHANNELS : ['EMAIL'];
}

export function checkInOpensAt(dueAt: Date) {
  return new Date(new Date(dueAt).getTime() - CHECK_IN_OPENS_DAYS_BEFORE * DAY_MS);
}

export function checkInDeadline(dueAt: Date, deadline: number) {
  return new Date(new Date(dueAt).getTime() + deadline * DAY_MS);
}
