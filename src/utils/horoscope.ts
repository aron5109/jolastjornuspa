import dataset from '../data/horoscopes/december-2026.json';
import type { DailyHoroscope, HoroscopeDataset, ZodiacId, ZodiacSign } from '../types';
import { formatDateIs } from './dates';

const DATA = dataset as HoroscopeDataset;

const BY_KEY = new Map<string, DailyHoroscope>(
  DATA.forecasts.map((forecast) => [`${forecast.date}|${forecast.sign}`, forecast]),
);

/** The committed forecast for a sign on a date. Same date + same sign always gives the same text. */
export function getHoroscope(date: string, sign: ZodiacId): DailyHoroscope | null {
  return BY_KEY.get(`${date}|${sign}`) ?? null;
}

export function allHoroscopes(): DailyHoroscope[] {
  return DATA.forecasts;
}

/** Plain-text version for the clipboard. */
export function formatForecastForCopy(sign: ZodiacSign, horoscope: DailyHoroscope): string {
  return [
    `Jólastjörnuspá — ${sign.name}`,
    formatDateIs(horoscope.date),
    '',
    'Vinnan:',
    horoscope.work,
    '',
    'Jólin:',
    horoscope.christmas,
    '',
    'Heppnin:',
    horoscope.luck,
    '',
    'Stjörnuboð dagsins:',
    horoscope.message,
    '',
    'Til gamans gert.',
  ].join('\n');
}
