#!/usr/bin/env node
/**
 * Fetches NASA SVS "Moon Phase and Libration, 2026" and writes a compact December extract to
 * src/data/astronomy/december-2026.json, one observation per date at 12:00 UTC.
 *
 * Source: NASA Scientific Visualization Studio, https://svs.gsfc.nasa.gov/5587/
 * Data:   https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json
 *
 * The NASA file is an array of hourly records. The fields used here are:
 *   time      "01 Dec 2026 12:00 UTC"
 *   phase     illuminated percentage of the disc (0–100)
 *   age       days since the last new Moon
 *   distance  Earth–Moon distance in km
 * Values are copied as published (rounded for display only). The waxing flag and the phase name
 * are derived from those values; nothing is invented. If the download fails or the format is not
 * what this script expects, it exits with an error and leaves the existing file untouched.
 *
 * Usage: npm run fetch:moon            (downloads from NASA)
 *        npm run fetch:moon -- file.json (uses a local copy of mooninfo_2026.json)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/astronomy/december-2026.json');
const LANDING_PAGE = 'https://svs.gsfc.nasa.gov/5587/';
const DATA_URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json';
const SAMPLE_HOUR_UTC = 12;

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

/** Parses "01 Dec 2026 12:00 UTC" (the SVS format) or an ISO 8601 timestamp. */
export function parseNasaTime(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2})(?::\d{2})? UTC$/.exec(value.trim());
  if (match) {
    const [, d, mon, y, h, min] = match;
    if (!(mon in MONTHS)) return null;
    return new Date(Date.UTC(Number(y), MONTHS[mon], Number(d), Number(h), Number(min)));
  }
  const iso = new Date(value);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Phase name key from illuminated percentage and direction (thresholds documented in README). */
export function phaseKey(illumination, waxing) {
  if (illumination < 3) return 'nytt-tungl';
  if (illumination > 97) return 'fullt-tungl';
  if (illumination >= 45 && illumination <= 55) return waxing ? 'fyrsta-kvartil' : 'sidasta-kvartil';
  if (illumination < 45) return waxing ? 'vaxandi-sigd' : 'minnkandi-sigd';
  return waxing ? 'vaxandi-tungl' : 'minnkandi-tungl';
}

function requireNumber(record, key) {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`NASA record ${record.time} has no numeric "${key}". Keys: ${Object.keys(record).join(', ')}`);
  }
  return value;
}

async function loadRecords(localPath) {
  if (localPath) return JSON.parse(readFileSync(resolve(localPath), 'utf8'));
  const response = await fetch(DATA_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`NASA responded ${response.status} ${response.statusText}`);
  return response.json();
}

export function extractDecember(records) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Unexpected NASA format: not an array');
  const timed = records
    .map((record) => ({ record, time: parseNasaTime(record.time) }))
    .filter((entry) => entry.time !== null)
    .sort((a, b) => a.time - b.time);

  const days = [];
  for (let day = 1; day <= 31; day += 1) {
    const target = Date.UTC(2026, 11, day, SAMPLE_HOUR_UTC);
    const index = timed.findIndex((entry) => entry.time.getTime() === target);
    if (index === -1) throw new Error(`NASA data has no record for 2026-12-${day} 12:00 UTC`);
    const { record } = timed[index];
    const illumination = requireNumber(record, 'phase');
    const ageDays = requireNumber(record, 'age');
    const distanceKm = requireNumber(record, 'distance');

    // Direction from the neighbouring hourly samples; fall back to the Moon's age.
    const next = timed[index + 1]?.record;
    const previous = timed[index - 1]?.record;
    let waxing;
    if (next && Number.isFinite(Number(next.phase)) && Number(next.phase) !== illumination) {
      waxing = Number(next.phase) > illumination;
    } else if (previous && Number.isFinite(Number(previous.phase)) && Number(previous.phase) !== illumination) {
      waxing = illumination > Number(previous.phase);
    } else {
      waxing = ageDays < 29.530588 / 2;
    }

    const date = `2026-12-${String(day).padStart(2, '0')}`;
    days.push({
      date,
      sampleTime: `${date}T12:00:00Z`,
      illumination: Math.round(illumination * 100) / 100,
      ageDays: Math.round(ageDays * 100) / 100,
      distanceKm: Math.round(distanceKm),
      waxing,
      phase: phaseKey(illumination, waxing),
    });
  }
  return days;
}

async function main() {
  const localPath = process.argv[2];
  const records = await loadRecords(localPath);
  const days = extractDecember(records);
  const dataset = {
    status: 'ok',
    source: {
      name: 'NASA Scientific Visualization Studio — Moon Phase and Libration, 2026',
      landingPage: LANDING_PAGE,
      dataUrl: DATA_URL,
      sampleTimeUtc: '12:00',
      retrievedAt: new Date().toISOString(),
      note:
        'One NASA hourly record per date at 12:00 UTC (= 12:00 in Atlantic/Reykjavik). illumination, ageDays and ' +
        'distanceKm are NASA values (rounded); waxing and phase are derived from them by scripts/fetch-moon-data.mjs.',
    },
    days,
  };
  writeFileSync(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${days.length} days of NASA Moon data to ${OUTPUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`✗ Could not build Moon data: ${error.message}`);
    console.error('  The existing src/data/astronomy/december-2026.json was left unchanged.');
    process.exit(1);
  });
}
