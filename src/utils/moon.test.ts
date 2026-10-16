import { extractDecember, parseNasaTime, phaseKey } from '../../scripts/fetch-moon-data.mjs';
import { formatDistance, formatIllumination, formatNumberIs } from './moon';

describe('Moon data ingestion', () => {
  it('parses the NASA SVS time format', () => {
    expect(parseNasaTime('12 Dec 2026 12:00 UTC')?.toISOString()).toBe('2026-12-12T12:00:00.000Z');
    expect(parseNasaTime('nonsense')).toBeNull();
  });

  it('names phases from illumination and direction', () => {
    expect(phaseKey(1, true)).toBe('nytt-tungl');
    expect(phaseKey(20, true)).toBe('vaxandi-sigd');
    expect(phaseKey(50, true)).toBe('fyrsta-kvartil');
    expect(phaseKey(80, true)).toBe('vaxandi-tungl');
    expect(phaseKey(99, false)).toBe('fullt-tungl');
    expect(phaseKey(80, false)).toBe('minnkandi-tungl');
    expect(phaseKey(50, false)).toBe('sidasta-kvartil');
    expect(phaseKey(20, false)).toBe('minnkandi-sigd');
  });

  it('extracts one 12:00 UTC record per December date and keeps NASA values', () => {
    // Synthetic test fixture shaped like the NASA file (not real data).
    const records = [];
    for (let day = 1; day <= 31; day += 1) {
      for (const hour of [11, 12, 13]) {
        records.push({
          time: `${String(day).padStart(2, '0')} Dec 2026 ${hour}:00 UTC`,
          phase: day + hour / 100,
          age: day / 2,
          distance: 380000 + day,
        });
      }
    }
    const days = extractDecember(records);
    expect(days).toHaveLength(31);
    expect(days[11]).toMatchObject({
      date: '2026-12-12',
      sampleTime: '2026-12-12T12:00:00Z',
      illumination: 12.12,
      distanceKm: 380012,
      waxing: true,
    });
  });

  it('refuses incomplete data instead of filling gaps', () => {
    expect(() => extractDecember([{ time: '01 Dec 2026 12:00 UTC', phase: 10, age: 1, distance: 380000 }])).toThrow();
  });
});

describe('Icelandic number formatting', () => {
  it('uses a decimal comma and dot thousands separator', () => {
    expect(formatNumberIs(378957)).toBe('378.957');
    expect(formatIllumination(47.5)).toBe('47,5% upplýst');
    expect(formatDistance(378957.4)).toBe('378.957 km');
  });
});
