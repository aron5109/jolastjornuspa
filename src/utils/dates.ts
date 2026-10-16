import { OPEN_ALL_DAYS } from '../config';

/**
 * All date logic for the site. Everything is evaluated in Atlantic/Reykjavik, never in the
 * visitor's device timezone. Iceland is UTC+0 all year, but the zone is still named explicitly
 * so the intent is clear and the logic survives any future change.
 */
export const SITE_TIME_ZONE = 'Atlantic/Reykjavik';
export const YEAR = 2026;
export const FIRST_DAY = '2026-12-01';
export const LAST_DAY = '2026-12-31';
export const DAYS_IN_DECEMBER = 31;

export type SitePhase = 'before' | 'december' | 'after';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const reykjavikFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's calendar date in Reykjavik as YYYY-MM-DD. */
export function reykjavikDateISO(now: Date): string {
  const parts = reykjavikFormatter.formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isValidISODate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** All 31 December dates as ISO strings. */
export const DECEMBER_DATES: string[] = Array.from(
  { length: DAYS_IN_DECEMBER },
  (_, index) => `${YEAR}-12-${String(index + 1).padStart(2, '0')}`,
);

export function isDecemberDate(value: string): boolean {
  return DECEMBER_DATES.includes(value);
}

export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

/* ---------------------------------------------------------------------------------------------
 * Preview date (developer testing only)
 *
 * `?previewDate=YYYY-MM-DD` overrides the clock so every December date can be tested before
 * December. It is deliberately isolated here: nothing else in the app reads the clock directly.
 * It is not exposed anywhere in the UI.
 * ------------------------------------------------------------------------------------------- */

export function readPreviewDate(search: string): string | null {
  const value = new URLSearchParams(search).get('previewDate');
  return value && isValidISODate(value) ? value : null;
}

/** The first day after December: the site treats it as the archive, with every day open. */
export const ARCHIVE_DAY = `${YEAR + 1}-01-01`;

/**
 * The effective "today" for the site: the preview date when present, otherwise the Reykjavik
 * date. While `OPEN_ALL_DAYS` (src/config.ts) is on, the default is the archive so every day
 * can be tested; `?previewDate=` still wins so the teaser and day locks can be checked.
 */
export function resolveToday(search: string, now: Date = new Date(), openAllDays = OPEN_ALL_DAYS): string {
  const preview = readPreviewDate(search);
  if (preview) return preview;
  const today = reykjavikDateISO(now);
  return openAllDays && today < ARCHIVE_DAY ? ARCHIVE_DAY : today;
}

export function sitePhase(today: string): SitePhase {
  if (today < FIRST_DAY) return 'before';
  if (today > LAST_DAY) return 'after';
  return 'december';
}

/** A December date can be opened when it is today or earlier. After December everything is open. */
export function isDateUnlocked(date: string, today: string): boolean {
  return isDecemberDate(date) && date <= today;
}

/** The latest December date a visitor may open. */
export function latestUnlockedDate(today: string): string | null {
  const phase = sitePhase(today);
  if (phase === 'before') return null;
  if (phase === 'after') return LAST_DAY;
  return today;
}

export function daysUntilOpening(today: string): number {
  const [y, m, d] = today.split('-').map(Number);
  const from = Date.UTC(y, m - 1, d);
  const to = Date.UTC(YEAR, 11, 1);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

const MONTHS_IS = [
  'janúar',
  'febrúar',
  'mars',
  'apríl',
  'maí',
  'júní',
  'júlí',
  'ágúst',
  'september',
  'október',
  'nóvember',
  'desember',
];

const WEEKDAYS_IS = [
  'sunnudagur',
  'mánudagur',
  'þriðjudagur',
  'miðvikudagur',
  'fimmtudagur',
  'föstudagur',
  'laugardagur',
];

/** "12. desember 2026" */
export function formatDateIs(isoDate: string, withYear = true): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d}. ${MONTHS_IS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** "laugardagur" */
export function weekdayIs(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return WEEKDAYS_IS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
