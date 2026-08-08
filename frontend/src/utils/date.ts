/**
 * Local-timezone date helpers.
 *
 * `new Date().toISOString()` returns the UTC date, which is *yesterday's*
 * date for users east of UTC (e.g. IST) between midnight and the UTC offset.
 * All "which day is it" logic in the app must use these local helpers so
 * check-ins, streaks and logbook entries line up with the user's calendar.
 */

/** Format a Date as YYYY-MM-DD in the device's local timezone. */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's date as YYYY-MM-DD in the device's local timezone. */
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}
