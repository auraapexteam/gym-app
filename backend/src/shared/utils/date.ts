/** Current date in UTC as `YYYY-MM-DD`. */
export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

/** The UTC date `days` before today as `YYYY-MM-DD`. */
export const daysAgoUtc = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};
