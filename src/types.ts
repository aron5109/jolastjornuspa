export const ZODIAC_IDS = [
  'hrutur',
  'naut',
  'tviburar',
  'krabbi',
  'ljon',
  'meyja',
  'vog',
  'sporddreki',
  'bogmadur',
  'steingeit',
  'vatnsberi',
  'fiskar',
] as const;

export type ZodiacId = (typeof ZODIAC_IDS)[number];

export type Element = 'Eldur' | 'Jörð' | 'Loft' | 'Vatn';

/** A star in a stylised constellation drawing, in a 0–100 coordinate space. */
export type ConstellationStar = {
  x: number;
  y: number;
  /** Relative brightness, 1 (faint) to 3 (bright). */
  magnitude: 1 | 2 | 3;
};

export type Constellation = {
  stars: ConstellationStar[];
  /** Pairs of indexes into `stars`. */
  lines: [number, number][];
};

export type ZodiacSign = {
  id: ZodiacId;
  /** Nominative with the definite article, e.g. "Steingeitin". */
  name: string;
  /** Accusative with the definite article, used in "Um Steingeitina". */
  nameAccusative: string;
  dateRange: string;
  keyword: string;
  planet: string;
  element: Element;
  colors: string[];
  metal: string;
  stones: string[];
  bodyAssociations: string[];
  constellation: Constellation;
};

export type DailyHoroscope = {
  date: string;
  sign: ZodiacId;
  headline: string;
  work: string;
  christmas: string;
  luck: string;
  message: string;
};

export type HoroscopeDataset = {
  year: number;
  month: number;
  generatedBy: string;
  forecasts: DailyHoroscope[];
};

export type MoonPhaseKey =
  | 'nytt-tungl'
  | 'vaxandi-sigd'
  | 'fyrsta-kvartil'
  | 'vaxandi-tungl'
  | 'fullt-tungl'
  | 'minnkandi-tungl'
  | 'sidasta-kvartil'
  | 'minnkandi-sigd';

export type MoonDay = {
  /** ISO calendar date, Atlantic/Reykjavik (which equals UTC in December). */
  date: string;
  /** Exact NASA sample time used for this date, ISO 8601 in UTC. */
  sampleTime: string;
  /** Percentage of the Moon's disc that is illuminated, from NASA ("phase"). */
  illumination: number;
  /** Days since the last new Moon, from NASA ("age"). */
  ageDays: number;
  /** Earth–Moon centre distance in km, from NASA ("distance"). */
  distanceKm: number;
  /** Derived from consecutive NASA samples: true while illumination is increasing. */
  waxing: boolean;
  /** Derived from `illumination` and `waxing` by scripts/fetch-moon-data.mjs. */
  phase: MoonPhaseKey;
};

export type MoonDataset = {
  status: 'ok' | 'missing';
  source: {
    name: string;
    landingPage: string;
    dataUrl: string;
    sampleTimeUtc: string;
    retrievedAt: string | null;
    note: string;
  };
  days: MoonDay[];
};
