import { BadRequestException } from '@nestjs/common';
import { CheckInCadence } from './entities/check-in-policy.entity';

interface CalendarTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function formatter(timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    throw new BadRequestException('Choose a valid IANA timezone.');
  }
}

function calendarParts(date: Date, format: Intl.DateTimeFormat): CalendarTime {
  const parts = Object.fromEntries(
    format.formatToParts(date).map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function calendarTimestamp(parts: CalendarTime) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

/** Calendar cadence in the user's zone. DST folds use the earlier occurrence;
 * nonexistent spring-forward times move forward by the gap. Month-end dates clamp. */
export function nextCheckInAt(
  policy: { cadence: CheckInCadence; preferredTime: string; timezone?: string },
  now = new Date(),
): Date {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(policy.preferredTime))
    throw new BadRequestException('Choose a valid check-in time.');
  const format = formatter(policy.timezone || 'Asia/Kolkata');
  const local = calendarParts(now, format);
  const [hour, minute] = policy.preferredTime.split(':').map(Number);
  let date: Date;
  if (policy.cadence === CheckInCadence.WEEKLY) {
    date = new Date(Date.UTC(local.year, local.month - 1, local.day + 7));
  } else {
    const firstOfNextMonth = new Date(Date.UTC(local.year, local.month, 1));
    const lastDay = new Date(
      Date.UTC(local.year, local.month + 1, 0),
    ).getUTCDate();
    date = new Date(
      Date.UTC(
        firstOfNextMonth.getUTCFullYear(),
        firstOfNextMonth.getUTCMonth(),
        Math.min(local.day, lastDay),
      ),
    );
  }
  const desired = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
  );
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 12) {
    const sample = new Date(desired + hours * 3600000);
    offsets.add(
      calendarTimestamp(calendarParts(sample, format)) - sample.getTime(),
    );
  }
  const candidates = [...offsets].map((offset) => {
    const instant = new Date(desired - offset);
    return {
      instant,
      shift: calendarTimestamp(calendarParts(instant, format)) - desired,
    };
  });
  const exact = candidates
    .filter((candidate) => candidate.shift === 0)
    .sort((a, b) => a.instant.getTime() - b.instant.getTime());
  if (exact.length) return exact[0].instant;
  const forward = candidates
    .filter((candidate) => candidate.shift > 0)
    .sort((a, b) => a.shift - b.shift);
  if (forward.length) return forward[0].instant;
  throw new BadRequestException(
    'Unable to calculate the next check-in in this timezone.',
  );
}
