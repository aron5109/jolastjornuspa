import dataset from '../data/astronomy/december-2026.json';
import type { MoonDataset, MoonDay, MoonPhaseKey } from '../types';

export const MOON_DATA = dataset as MoonDataset;

export const PHASE_LABELS: Record<MoonPhaseKey, string> = {
  'nytt-tungl': 'Nýtt tungl',
  'vaxandi-sigd': 'Vaxandi sigð',
  'fyrsta-kvartil': 'Fyrsta kvartil',
  'vaxandi-tungl': 'Vaxandi tungl',
  'fullt-tungl': 'Fullt tungl',
  'minnkandi-tungl': 'Minnkandi tungl',
  'sidasta-kvartil': 'Síðasta kvartil',
  'minnkandi-sigd': 'Minnkandi sigð',
};

/** NASA data for a date, or null when it has not been ingested. Never estimated. */
export function getMoonDay(date: string): MoonDay | null {
  if (MOON_DATA.status !== 'ok') return null;
  return MOON_DATA.days.find((day) => day.date === date) ?? null;
}

/**
 * Icelandic number formatting (decimal comma, dot as thousands separator), written out by hand
 * because not every browser ships Icelandic locale data for Intl.NumberFormat.
 */
export function formatNumberIs(value: number, fractionDigits = 0): string {
  const [whole, fraction] = Math.abs(value).toFixed(fractionDigits).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}${grouped}${fraction ? `,${fraction}` : ''}`;
}

/** "47,5% upplýst" */
export function formatIllumination(value: number): string {
  return `${formatNumberIs(value, 1)}% upplýst`;
}

/** "378.957 km" */
export function formatDistance(km: number): string {
  return `${formatNumberIs(Math.round(km))} km`;
}

/** "21,3 dagar" */
export function formatAge(days: number): string {
  return `${formatNumberIs(days, 1)} dagar`;
}
