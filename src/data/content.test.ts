import { ZODIAC_IDS } from '../types';
import { allHoroscopes, getHoroscope } from '../utils/horoscope';
import { DECEMBER_DATES } from '../utils/dates';
import { SIGNS } from './signs';

const EXPECTED_SIGNS: [string, string][] = [
  ['Hrúturinn', '21. mars – 19. apríl'],
  ['Nautið', '20. apríl – 20. maí'],
  ['Tvíburarnir', '21. maí – 20. júní'],
  ['Krabbinn', '21. júní – 22. júlí'],
  ['Ljónið', '23. júlí – 22. ágúst'],
  ['Meyjan', '23. ágúst – 22. september'],
  ['Vogin', '23. september – 22. október'],
  ['Sporðdrekinn', '23. október – 21. nóvember'],
  ['Bogmaðurinn', '22. nóvember – 21. desember'],
  ['Steingeitin', '22. desember – 19. janúar'],
  ['Vatnsberinn', '20. janúar – 18. febrúar'],
  ['Fiskarnir', '19. febrúar – 20. mars'],
];

describe('signs', () => {
  it('has all twelve signs with the exact Icelandic labels', () => {
    expect(SIGNS.map((sign) => [sign.name, sign.dateRange])).toEqual(EXPECTED_SIGNS);
    expect(SIGNS.map((sign) => sign.id)).toEqual([...ZODIAC_IDS]);
  });

  it('has complete traditional associations and valid constellation drawings', () => {
    for (const sign of SIGNS) {
      expect(sign.keyword && sign.planet && sign.element && sign.metal).toBeTruthy();
      expect(sign.colors.length).toBeGreaterThan(0);
      expect(sign.stones.length).toBeGreaterThan(0);
      expect(sign.bodyAssociations.length).toBeGreaterThan(0);
      for (const [from, to] of sign.constellation.lines) {
        expect(sign.constellation.stars[from]).toBeDefined();
        expect(sign.constellation.stars[to]).toBeDefined();
      }
    }
  });

  it('keeps the metal consistent with the ruling planet', () => {
    const metalFor: Record<string, string> = {
      Sólin: 'Gull',
      Tunglið: 'Silfur',
      Merkúríus: 'Kvikasilfur',
      Venus: 'Kopar',
      Mars: 'Járn',
      Júpíter: 'Tin',
      Satúrnus: 'Blý',
    };
    for (const sign of SIGNS) expect(sign.metal).toBe(metalFor[sign.planet]);
  });
});

describe('horoscopes', () => {
  it('has a forecast for every sign on every December date', () => {
    expect(allHoroscopes()).toHaveLength(372);
    for (const date of DECEMBER_DATES) {
      for (const id of ZODIAC_IDS) {
        const forecast = getHoroscope(date, id);
        expect(forecast?.work.trim()).toBeTruthy();
        expect(forecast?.christmas.trim()).toBeTruthy();
        expect(forecast?.luck.trim()).toBeTruthy();
        expect(forecast?.message.trim()).toBeTruthy();
      }
    }
  });

  it('never repeats a Vinnan, Jólin or Heppnin text', () => {
    const all = allHoroscopes();
    for (const field of ['work', 'christmas', 'luck'] as const) {
      expect(new Set(all.map((forecast) => forecast[field])).size).toBe(372);
    }
  });

  it('gives the same forecast for the same date and sign', () => {
    expect(getHoroscope('2026-12-12', 'steingeit')).toBe(getHoroscope('2026-12-12', 'steingeit'));
    expect(getHoroscope('2026-12-12', 'steingeit')).not.toEqual(getHoroscope('2026-12-13', 'steingeit'));
  });
});
