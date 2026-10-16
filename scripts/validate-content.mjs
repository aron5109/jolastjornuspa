#!/usr/bin/env node
/**
 * Validates the committed content before every build:
 * - src/data/horoscopes/december-2026.json: 31 valid ISO dates × 12 expected signs = 372
 *   forecasts, no empty fields, no duplicate Vinnan/Jólin/Heppnin texts.
 * - src/data/astronomy/december-2026.json: either a complete, well-formed NASA extract for all
 *   31 dates, or an explicit "missing" status with no numbers at all (never partial or invented).
 *
 * Exits with code 1 on any error.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_SIGNS = [
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
];
const EXPECTED_DATES = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
const TEXT_FIELDS = ['headline', 'work', 'christmas', 'luck', 'message'];
const UNIQUE_FIELDS = { work: 'Vinnan', christmas: 'Jólin', luck: 'Heppnin' };
const PHASES = [
  'nytt-tungl',
  'vaxandi-sigd',
  'fyrsta-kvartil',
  'vaxandi-tungl',
  'fullt-tungl',
  'minnkandi-tungl',
  'sidasta-kvartil',
  'minnkandi-sigd',
];

const errors = [];
const warnings = [];

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: cannot be read as JSON (${error.message})`);
    return null;
  }
}

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/* ----------------------------------------------------------------------------- horoscopes */

function validateHoroscopes() {
  const file = 'src/data/horoscopes/december-2026.json';
  const data = readJson(file);
  if (!data) return;
  if (!Array.isArray(data.forecasts)) {
    errors.push(`${file}: "forecasts" must be an array`);
    return;
  }

  const seenPairs = new Set();
  const seenTexts = Object.fromEntries(Object.keys(UNIQUE_FIELDS).map((key) => [key, new Map()]));
  const signsByDate = new Map(EXPECTED_DATES.map((date) => [date, new Set()]));

  data.forecasts.forEach((forecast, index) => {
    const where = `${file} #${index} (${forecast?.date} ${forecast?.sign})`;
    if (!isValidIsoDate(forecast?.date)) errors.push(`${where}: invalid ISO date`);
    else if (!signsByDate.has(forecast.date)) errors.push(`${where}: date outside December 2026`);
    if (!EXPECTED_SIGNS.includes(forecast?.sign)) errors.push(`${where}: unexpected zodiac id`);

    for (const field of TEXT_FIELDS) {
      const value = forecast?.[field];
      if (typeof value !== 'string' || value.trim() === '') errors.push(`${where}: empty "${field}"`);
      else if (value !== value.trim() || /\s{2,}/.test(value)) errors.push(`${where}: stray whitespace in "${field}"`);
    }

    const pair = `${forecast?.date}|${forecast?.sign}`;
    if (seenPairs.has(pair)) errors.push(`${where}: duplicate date/sign combination`);
    seenPairs.add(pair);
    signsByDate.get(forecast?.date)?.add(forecast?.sign);

    for (const [field, label] of Object.entries(UNIQUE_FIELDS)) {
      const text = forecast?.[field];
      if (typeof text !== 'string') continue;
      const previous = seenTexts[field].get(text);
      if (previous) errors.push(`${where}: ${label} text duplicates ${previous}`);
      else seenTexts[field].set(text, pair);
    }
  });

  for (const [date, signs] of signsByDate) {
    for (const sign of EXPECTED_SIGNS) {
      if (!signs.has(sign)) errors.push(`${file}: missing forecast for ${sign} on ${date}`);
    }
  }
  if (data.forecasts.length !== EXPECTED_DATES.length * EXPECTED_SIGNS.length) {
    errors.push(`${file}: expected 372 forecasts, found ${data.forecasts.length}`);
  }

  // Readers follow one sign through the month, so the extras must not repeat within a sign.
  for (const field of ['message', 'headline']) {
    for (const sign of EXPECTED_SIGNS) {
      const values = data.forecasts.filter((f) => f.sign === sign).map((f) => f[field]);
      if (new Set(values).size !== values.length) errors.push(`${file}: "${field}" repeats within ${sign}`);
    }
  }

  return data.forecasts.length;
}

/* ----------------------------------------------------------------------------- astronomy */

function validateAstronomy() {
  const file = 'src/data/astronomy/december-2026.json';
  const data = readJson(file);
  if (!data) return 'unreadable';
  if (!data.source?.dataUrl || !data.source?.landingPage) errors.push(`${file}: source metadata is required`);

  if (data.status === 'missing') {
    if (Array.isArray(data.days) && data.days.length > 0) {
      errors.push(`${file}: status "missing" must not contain any day values`);
    }
    warnings.push(
      `${file}: NASA Moon data has not been fetched yet. Run "npm run fetch:moon" with network access ` +
        'or the "Sækja tunglgögn frá NASA" workflow. The site shows the Moon panel as unavailable until then.',
    );
    return 'missing';
  }
  if (data.status !== 'ok') {
    errors.push(`${file}: status must be "ok" or "missing"`);
    return 'invalid';
  }
  if (!data.source.retrievedAt) errors.push(`${file}: source.retrievedAt is required when status is "ok"`);

  const byDate = new Map((data.days ?? []).map((day) => [day.date, day]));
  for (const date of EXPECTED_DATES) {
    const day = byDate.get(date);
    if (!day) {
      errors.push(`${file}: missing Moon data for ${date}`);
      continue;
    }
    const where = `${file} ${date}`;
    if (typeof day.sampleTime !== 'string' || !day.sampleTime.startsWith(date)) errors.push(`${where}: bad sampleTime`);
    if (!(Number.isFinite(day.illumination) && day.illumination >= 0 && day.illumination <= 100)) {
      errors.push(`${where}: illumination must be 0–100`);
    }
    if (!(Number.isFinite(day.ageDays) && day.ageDays >= 0 && day.ageDays < 30)) errors.push(`${where}: bad ageDays`);
    if (!(Number.isFinite(day.distanceKm) && day.distanceKm > 350000 && day.distanceKm < 410000)) {
      errors.push(`${where}: distanceKm outside the Moon's orbital range`);
    }
    if (typeof day.waxing !== 'boolean') errors.push(`${where}: waxing must be boolean`);
    if (!PHASES.includes(day.phase)) errors.push(`${where}: unknown phase "${day.phase}"`);
  }
  if ((data.days ?? []).length !== EXPECTED_DATES.length) {
    errors.push(`${file}: expected 31 days, found ${(data.days ?? []).length}`);
  }
  return 'ok';
}

const forecastCount = validateHoroscopes();
const moonStatus = validateAstronomy();

for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (errors.length > 0) {
  console.error(`✗ Content validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  if (errors.length > 50) console.error(`  … and ${errors.length - 50} more`);
  process.exit(1);
}
console.log(`✓ Horoscopes: ${forecastCount} forecasts (31 dates × 12 signs), all fields populated, no duplicates.`);
console.log(`✓ Astronomy: status "${moonStatus}".`);
