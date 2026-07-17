/** One successful check-in per member per day (also enforced by a DB unique index). */
export const MAX_DAILY_CHECK_INS = 1;

/** Windows used by the attendance statistics endpoint. */
export const STATS_WINDOW_DAYS = {
  WEEK: 7,
  MONTH: 30,
} as const;
