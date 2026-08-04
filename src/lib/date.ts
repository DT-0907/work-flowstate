/**
 * FlowState runs on Pacific time everywhere.
 *
 * Without this, "today" is derived from `new Date().toISOString()`, which is UTC:
 * on the server (Vercel runs UTC) the day would roll over at 4-5pm Pacific, and on
 * the client it would follow the device clock — so habits, journal entries and
 * recommendations would disagree about what day it is.
 */

export const PACIFIC_TZ = "America/Los_Angeles";

/** Hour (Pacific) at which the next day's journal entry unlocks. */
export const JOURNAL_UNLOCK_HOUR = 22;

export interface PacificParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function partsFromIntl(d: Date): PacificParts | null {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: PACIFIC_TZ,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(d);

    const p: Record<string, string> = {};
    for (const { type, value } of formatted) p[type] = value;
    if (!p.year || !p.month || !p.day || !p.hour || !p.minute || !p.second) return null;

    return {
      year: Number(p.year),
      month: Number(p.month),
      day: Number(p.day),
      hour: Number(p.hour) % 24, // some engines report midnight as "24"
      minute: Number(p.minute),
      second: Number(p.second),
    };
  } catch {
    return null;
  }
}

/** Day-of-month of the nth Sunday of a given month (month is 0-indexed). */
function nthSunday(year: number, month: number, n: number): number {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((7 - firstDow) % 7) + (n - 1) * 7;
}

/**
 * US Pacific daylight saving: 2nd Sunday of March 02:00 local through
 * 1st Sunday of November 02:00 local. Only used as a fallback for runtimes
 * without full IANA time zone data (some Hermes/Android builds).
 */
function isPacificDST(d: Date): boolean {
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 2, nthSunday(year, 2, 2), 10); // 02:00 PST = 10:00 UTC
  const end = Date.UTC(year, 10, nthSunday(year, 10, 1), 9); // 02:00 PDT = 09:00 UTC
  const t = d.getTime();
  return t >= start && t < end;
}

function partsFromOffset(d: Date): PacificParts {
  const shifted = new Date(d.getTime() - (isPacificDST(d) ? 7 : 8) * 3_600_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function pacificParts(now: Date = new Date()): PacificParts {
  return partsFromIntl(now) ?? partsFromOffset(now);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The Pacific calendar date an instant falls on, as "YYYY-MM-DD". */
export function toPacificDate(d: Date): string {
  const { year, month, day } = pacificParts(d);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Current Pacific calendar date as "YYYY-MM-DD". */
export function todayPT(now: Date = new Date()): string {
  return toPacificDate(now);
}

/** Current hour (0-23) in Pacific time. */
export function pacificHour(now: Date = new Date()): number {
  return pacificParts(now).hour;
}

/** Shift a "YYYY-MM-DD" string by whole days. */
export function addDaysPT(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * The journal date to show by default: today, or tomorrow once it's past
 * JOURNAL_UNLOCK_HOUR, so the next day can be planned the night before.
 * Habits, streaks and recommendations deliberately do NOT use this — they
 * stay on the real midnight-to-midnight Pacific day.
 */
export function journalDatePT(now: Date = new Date()): string {
  const today = todayPT(now);
  return pacificHour(now) >= JOURNAL_UNLOCK_HOUR ? addDaysPT(today, 1) : today;
}

/** True if `date` is a journal day the user is allowed to open yet. */
export function isJournalDateAvailable(date: string, now: Date = new Date()): boolean {
  return date <= journalDatePT(now);
}

/** UTC offset in effect in Pacific on `date`, e.g. "-07:00". */
export function pacificOffsetFor(date: string): string {
  return isPacificDST(new Date(`${date}T12:00:00Z`)) ? "-07:00" : "-08:00";
}

/** The instant midnight Pacific begins on `date`, as an offset-qualified ISO string. */
export function dayStartISO(date: string): string {
  return `${date}T00:00:00${pacificOffsetFor(date)}`;
}

/** The instant the Pacific day `date` ends (i.e. midnight of the next day). */
export function dayEndISO(date: string): string {
  return dayStartISO(addDaysPT(date, 1));
}

/**
 * When something picked for `date` on a date-only input is due: the last second
 * of that Pacific day. Storing the *start* of the day would make an assignment
 * read as overdue for the whole day it is actually due.
 */
export function dueByISO(date: string): string {
  return `${date}T23:59:59${pacificOffsetFor(date)}`;
}

/**
 * Shift an instant by whole days on the Pacific calendar, keeping the same
 * wall-clock time. Adding 7*24h instead would drift an hour across a DST
 * change — enough to push a near-midnight due date onto the wrong day.
 */
export function shiftDaysPreservingWallClock(instant: Date, days: number): string {
  const { hour, minute, second } = pacificParts(instant);
  const date = addDaysPT(toPacificDate(instant), days);
  return `${date}T${pad(hour)}:${pad(minute)}:${pad(second)}${pacificOffsetFor(date)}`;
}

/** Monday of the Pacific week containing `now`, as "YYYY-MM-DD". */
export function startOfWeekPT(now: Date = new Date()): string {
  const today = todayPT(now);
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDaysPT(today, dow === 0 ? -6 : 1 - dow);
}

/**
 * Whole Pacific calendar days from `from` to `to` (negative if `to` is earlier).
 * Compare dates with this rather than dividing an elapsed-millisecond difference:
 * something due at 11:59pm tonight is due *today*, not "in 1 day".
 */
export function daysBetweenPT(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Human label ("Wednesday, July 29") for a "YYYY-MM-DD" string. */
export function formatDateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }
): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}

/** Short weekday label ("Mon") for a "YYYY-MM-DD" string. */
export function weekdayShort(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}
