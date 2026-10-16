#!/usr/bin/env node
/**
 * Deterministically builds src/data/horoscopes/december-2026.json from the curated pools in
 * scripts/horoscope-content.mjs. The output is committed; the site never generates text at
 * runtime. Re-running this script with unchanged pools produces byte-identical output.
 *
 * Guarantees (also checked by scripts/validate-content.mjs):
 * - 31 dates × 12 signs = 372 forecasts, each with headline, work, christmas, luck and message.
 * - No two forecasts share a Vinnan, Jólin or Heppnin text anywhere in the month.
 * - Within one sign, no opener, twist, message or headline repeats during the month.
 * - Within one day, no two signs share an opener, twist, message or headline.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHRISTMAS_EVE,
  CHRISTMAS_OPENERS,
  CHRISTMAS_TWISTS,
  HEADLINES,
  LUCKY_OBJECTS,
  LUCK_OPENERS,
  MESSAGES,
  NEW_YEARS_EVE,
  WORK_OPENERS,
  WORK_TWISTS,
} from './horoscope-content.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/horoscopes/december-2026.json');

export const SIGN_IDS = [
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

/* ---------------------------------------------------------------------------------------------
 * Deterministic randomness
 * ------------------------------------------------------------------------------------------- */

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seedText) {
  let seed = hashString(seedText);
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, seedText) {
  const random = seededRandom(seedText);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ---------------------------------------------------------------------------------------------
 * Calendar
 * ------------------------------------------------------------------------------------------- */

function isoDate(day) {
  return `2026-12-${String(day).padStart(2, '0')}`;
}

function phaseFor(day) {
  if (day <= 8) return 'early';
  if (day <= 17) return 'mid';
  if (day <= 23) return 'late';
  if (day === 24) return 'eve';
  if (day <= 30) return 'romjul';
  return 'nye';
}

function isWeekend(day) {
  const weekday = new Date(Date.UTC(2026, 11, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

/* ---------------------------------------------------------------------------------------------
 * Picking with constraints
 * ------------------------------------------------------------------------------------------- */

/**
 * Tracks how often each pool item is used, which items each sign has already seen and which
 * items are taken on the current day.
 */
class Picker {
  constructor(name) {
    this.name = name;
    this.usage = new Map();
    this.seenBySign = new Map();
    this.takenToday = new Set();
  }

  startDay() {
    this.takenToday = new Set();
  }

  /**
   * candidates: [{ text, preferred }] — preferred items (date-specific) win ties over general ones.
   * accept: optional extra predicate.
   */
  pick(sign, candidates, seedText, accept = () => true) {
    const seen = this.seenBySign.get(sign) ?? new Set();
    const random = seededRandom(seedText);
    let best = null;
    let bestScore = Infinity;
    for (const candidate of candidates) {
      if (seen.has(candidate.text) || this.takenToday.has(candidate.text)) continue;
      if (!accept(candidate.text)) continue;
      const score = (this.usage.get(candidate.text) ?? 0) + (candidate.preferred ? 0 : 0.6) + random() * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = candidate.text;
      }
    }
    if (best === null) {
      throw new Error(`${this.name}: pool exhausted for ${sign} (${seedText}). Add more copy.`);
    }
    return best;
  }

  commit(sign, text) {
    this.usage.set(text, (this.usage.get(text) ?? 0) + 1);
    if (!this.seenBySign.has(sign)) this.seenBySign.set(sign, new Set());
    this.seenBySign.get(sign).add(text);
    this.takenToday.add(text);
  }
}

function candidatesFrom(preferred, general) {
  return [
    ...preferred.map((text) => ({ text, preferred: true })),
    ...general.map((text) => ({ text, preferred: false })),
  ];
}

/* ---------------------------------------------------------------------------------------------
 * Generation
 * ------------------------------------------------------------------------------------------- */

function generate() {
  const pickers = {
    workOpener: new Picker('Vinnan (opener)'),
    workTwist: new Picker('Vinnan (twist)'),
    christmasOpener: new Picker('Jólin (opener)'),
    christmasTwist: new Picker('Jólin (twist)'),
    luckOpener: new Picker('Heppnin (opener)'),
    luckObject: new Picker('Heppnin (object)'),
    message: new Picker('Stjörnuboð'),
    headline: new Picker('Headline'),
  };
  const usedTexts = { work: new Set(), christmas: new Set(), luck: new Set() };
  const forecasts = [];

  for (let day = 1; day <= 31; day += 1) {
    const date = isoDate(day);
    const phase = phaseFor(day);
    Object.values(pickers).forEach((picker) => picker.startDay());

    if (phase === 'eve' || phase === 'nye') {
      const special = phase === 'eve' ? CHRISTMAS_EVE : NEW_YEARS_EVE;
      const order = (key) => shuffled(special[key], `${date}|${key}`);
      const lists = {
        headlines: order('headlines'),
        work: order('work'),
        christmas: order('christmas'),
        luck: order('luck'),
        objects: order('objects'),
        messages: order('messages'),
      };
      SIGN_IDS.forEach((sign, index) => {
        forecasts.push({
          date,
          sign,
          headline: lists.headlines[index],
          work: lists.work[index],
          christmas: lists.christmas[index],
          luck: `${lists.luck[index]} Happahlutur dagsins: ${lists.objects[index]}.`,
          message: lists.messages[index],
        });
      });
      continue;
    }

    const weekend = isWeekend(day);
    const workOpeners = weekend
      ? candidatesFrom(WORK_OPENERS.weekend, [])
      : candidatesFrom(WORK_OPENERS[phase], WORK_OPENERS.any);
    const workTwists = candidatesFrom(weekend ? WORK_TWISTS.weekend : WORK_TWISTS.weekday, []);
    const christmasOpeners = candidatesFrom(CHRISTMAS_OPENERS[phase], CHRISTMAS_OPENERS.any);
    const christmasTwists = candidatesFrom([], CHRISTMAS_TWISTS);
    const luckOpeners = candidatesFrom(LUCK_OPENERS[phase], LUCK_OPENERS.any);
    const luckObjects = candidatesFrom([], LUCKY_OBJECTS);
    const messages = candidatesFrom([], MESSAGES);
    const headlines = candidatesFrom([], HEADLINES);

    // Visit signs in a different order each day so no sign always gets first pick.
    for (const sign of shuffled(SIGN_IDS, `${date}|order`)) {
      const seed = (part) => `${date}|${sign}|${part}`;

      const compose = (category, openerPicker, openers, twistPicker, twists, join) => {
        const opener = openerPicker.pick(sign, openers, seed(`${category}-opener`));
        const twist = twistPicker.pick(
          sign,
          twists,
          seed(`${category}-twist`),
          (candidate) => !usedTexts[category].has(join(opener, candidate)),
        );
        openerPicker.commit(sign, opener);
        twistPicker.commit(sign, twist);
        const text = join(opener, twist);
        usedTexts[category].add(text);
        return text;
      };

      const sentence = (a, b) => `${a} ${b}`;
      const work = compose('work', pickers.workOpener, workOpeners, pickers.workTwist, workTwists, sentence);
      const christmas = compose(
        'christmas',
        pickers.christmasOpener,
        christmasOpeners,
        pickers.christmasTwist,
        christmasTwists,
        sentence,
      );
      const luck = compose(
        'luck',
        pickers.luckOpener,
        luckOpeners,
        pickers.luckObject,
        luckObjects,
        (a, object) => `${a} Happahlutur dagsins: ${object}.`,
      );

      const message = pickers.message.pick(sign, messages, seed('message'));
      pickers.message.commit(sign, message);
      const headline = pickers.headline.pick(sign, headlines, seed('headline'));
      pickers.headline.commit(sign, headline);

      forecasts.push({ date, sign, headline, work, christmas, luck, message });
    }
  }

  const signOrder = new Map(SIGN_IDS.map((id, index) => [id, index]));
  forecasts.sort((a, b) => a.date.localeCompare(b.date) || signOrder.get(a.sign) - signOrder.get(b.sign));
  return forecasts;
}

const forecasts = generate();
const dataset = {
  year: 2026,
  month: 12,
  generatedBy: 'scripts/generate-horoscopes.mjs',
  forecasts,
};
writeFileSync(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
console.log(`Wrote ${forecasts.length} forecasts to ${OUTPUT}`);
