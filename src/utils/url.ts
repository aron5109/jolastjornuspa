import { isZodiacId } from '../data/signs';
import type { ZodiacId } from '../types';
import { isDecemberDate } from './dates';

export type UrlState = {
  sign: ZodiacId | null;
  date: string | null;
};

/** Reads ?sign= and ?date=. ?previewDate= is handled only by utils/dates. */
export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const sign = params.get('sign');
  const date = params.get('date');
  return {
    sign: isZodiacId(sign) ? sign : null,
    date: date && isDecemberDate(date) ? date : null,
  };
}

/**
 * Writes sign/date into the query string while keeping every other parameter (notably
 * previewDate) intact. `date` is omitted when it equals the default day.
 */
export function buildSearch(current: string, state: UrlState, defaultDate: string | null): string {
  const params = new URLSearchParams(current);
  if (state.sign) params.set('sign', state.sign);
  else params.delete('sign');
  if (state.sign && state.date && state.date !== defaultDate) params.set('date', state.date);
  else params.delete('date');
  const text = params.toString();
  return text ? `?${text}` : '';
}
