# Jólastjörnuspá

**Hvað segja stjörnurnar um desember hjá þér?**

Jólastjörnuspá is an interactive Icelandic Christmas horoscope microsite for staff. Every day from 1 to 31 December 2026 each of the twelve zodiac signs gets a new, humorous Christmas and workplace forecast in three parts (Vinnan, Jólin, Heppnin), plus a small "Stjörnuboð dagsins". A separate panel, "Himininn í dag", shows the real Moon for the selected day from NASA data.

The horoscope is entertainment ("Til gamans gert"). The astronomy panel is real data and is kept separate from it in layout and wording.

Intended URL: **https://aron5109.github.io/jolastjornuspa/**

No backend, no database, no accounts, no analytics, no cookies, no tracking and no runtime API calls. Everything is static and lives in this repository.

---

## Technology

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite (`base: '/jolastjornuspa/'`) |
| Styling | Plain CSS with custom properties (`src/styles/global.css`), SVG, two Canvas layers |
| Fonts | Cormorant Garamond (display) and Inter (body), bundled from `@fontsource` packages, no font CDN |
| Tests | Vitest + Testing Library (jsdom) |
| Quality | ESLint (typescript-eslint, react-hooks), `tsc`, content validation script |
| Hosting | GitHub Pages via GitHub Actions |

Runtime dependencies are only `react`, `react-dom` and the two font packages.

## Local setup

Requires Node 22 (see `.nvmrc`).

```bash
npm ci              # install exactly what package-lock.json pins
npm run dev         # http://localhost:5173/jolastjornuspa/
npm run build       # validate content, typecheck, build into dist/
npm run preview     # serve the production build: http://localhost:4173/jolastjornuspa/
```

Checks:

```bash
npm run validate    # content validation (forecasts + Moon data)
npm run typecheck
npm run lint
npm test
npm run check       # all of the above
```

## Testing December before December: `previewDate`

Before 1 December 2026 the live site shows a teaser ("Stjörnurnar eru að stilla sig af…" / "Jólastjörnuspáin opnar 1. desember."). To test any day, add `previewDate`; it overrides the clock and nothing else changes:

```
?previewDate=2026-12-01
?previewDate=2026-12-24
?previewDate=2026-12-31
?sign=steingeit&previewDate=2026-12-24
```

Full example: `https://aron5109.github.io/jolastjornuspa/?sign=steingeit&previewDate=2026-12-24`

`previewDate` is for testing only. It is not shown or linked anywhere in the UI. All handling lives in one place, `readPreviewDate` / `resolveToday` in `src/utils/dates.ts`; the rest of the app never reads the clock directly. Any date works, so `?previewDate=2027-01-05` previews the archive.

## Date behaviour (`Atlantic/Reykjavik`)

All date logic is evaluated in the `Atlantic/Reykjavik` time zone with `Intl.DateTimeFormat`, not the device time zone (`src/utils/dates.ts`).

| Today in Reykjavik | Behaviour |
|---|---|
| Before 1 Dec 2026 | Teaser only, no forecast content is reachable, `?sign=` is ignored |
| 1–31 Dec 2026 | Today is highlighted; earlier days can be opened; later days are visible but locked and disabled |
| After 31 Dec 2026 | Archive: "Jólastjörnuspá 2026", all 31 days unlocked; no January forecasts exist |

## URL state

| Parameter | Meaning |
|---|---|
| `sign` | Zodiac id, e.g. `?sign=steingeit` opens that forecast directly |
| `date` | A December date to open, e.g. `&date=2026-12-03`; ignored if that day is still locked |
| `previewDate` | Testing override for "today" (see above) |

Zodiac ids: `hrutur`, `naut`, `tviburar`, `krabbi`, `ljon`, `meyja`, `vog`, `sporddreki`, `bogmadur`, `steingeit`, `vatnsberi`, `fiskar`.

Only query parameters are used, so there is no client-side routing to break on GitHub Pages.

## Content structure

```
scripts/
  horoscope-content.mjs        curated Icelandic copy pools (edit text here)
  generate-horoscopes.mjs      deterministic generator → src/data/horoscopes/december-2026.json
  validate-content.mjs         content validation, runs before every build and in CI
  fetch-moon-data.mjs          NASA ingestion → src/data/astronomy/december-2026.json
src/
  data/
    signs.ts                   12 signs, labels, traditional associations, constellation drawings
    horoscopes/december-2026.json   372 committed daily forecasts
    astronomy/december-2026.json    committed NASA Moon extract (or an explicit "missing" marker)
  components/                  NebulaIntro, StarField, ZodiacSelector, ZodiacConstellation, ZodiacGlyph,
                               HoroscopeView, HoroscopeSection, ZodiacInfo, DecemberNavigator,
                               SkyToday, MoonPhase, CopyForecastButton, Teaser, icons
  hooks/                       useReducedMotion, useMediaQuery
  utils/                       dates, horoscope, moon, url, clipboard, forecastCard, introStorage
  styles/global.css
```

### Horoscope data

`src/data/horoscopes/december-2026.json` holds 31 dates × 12 signs = **372 forecasts**, each with `headline`, `work` (Vinnan), `christmas` (Jólin), `luck` (Heppnin) and `message` (Stjörnuboð dagsins), so 1,116 forecast texts in total.

The file is generated once by `npm run generate:horoscopes` and committed. The site only reads it, so the same date and sign always show the same text. The generator is deterministic (seeded; re-running gives byte-identical output) and pairs curated, self-contained Icelandic sentences under these rules:

- copy fits the time of month: early December, mid December (jólahlaðborð, jólapeysudagur), the last days before Christmas, the quiet days between Christmas and New Year, and weekend variants for Vinnan;
- 24 December and 31 December use their own hand-written texts: warmer and less work-heavy on Christmas Eve (without assuming everyone is off), reflective and forward-looking on New Year's Eve;
- no Vinnan, Jólin or Heppnin text appears twice in the month; within one sign no sentence, message or headline repeats; within one day no two signs share a sentence;
- copy avoids politics, religion, health, money, romance, family assumptions and gendered adjectives about the reader.

To change copy: edit `scripts/horoscope-content.mjs`, run `npm run generate:horoscopes`, check `npm run validate`, commit both files.

### Validation

`npm run validate` (also the first step of `npm run build` and of CI) checks that there are 31 valid ISO dates, the 12 expected zodiac ids on every date, 372 combinations, no empty Vinnan / Jólin / Heppnin / message / headline, no duplicate texts, and that the astronomy file is either complete and in range or explicitly marked missing with no numbers.

### Zodiac information

`src/data/signs.ts` holds the traditional associations shown under "Hefðbundnar tengingar í stjörnuspeki" (Lykilorð, Pláneta, Höfuðskepna, Litir, Málmur, Steinar, Hefðbundnar líkamstengingar). The tradition is Western tropical astrology with the classical planetary rulers (Mars for Sporðdrekinn, Satúrnus for Vatnsberinn, Júpíter for Fiskarnir), and each metal follows its ruling planet. The UI labels them as traditional associations, not facts, and says explicitly that body associations are not health information.

## Astronomy data: "Himininn í dag"

Source: **NASA Scientific Visualization Studio, Moon Phase and Libration, 2026**
Landing page: https://svs.gsfc.nasa.gov/5587/
Data: https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json

`scripts/fetch-moon-data.mjs` downloads the hourly NASA file, takes the 12:00 UTC record for each December date (12:00 in Reykjavik) and writes a compact file with the NASA illumination percentage, Moon age and Earth–Moon distance, plus source metadata. Whether the Moon is waxing comes from the neighbouring hourly NASA samples, and the Icelandic phase name from the illumination: below 3% Nýtt tungl, above 97% Fullt tungl, 45–55% Fyrsta / Síðasta kvartil, otherwise Vaxandi / Minnkandi sigð (below 45%) or Vaxandi / Minnkandi tungl. The site never fetches NASA at runtime and never estimates values.

**Current status:** the committed file holds the real NASA extract for all 31 dates (fetched by the workflow below on 16 October 2026). To refresh it, either:

- run the **"Sækja tunglgögn frá NASA"** workflow from the Actions tab (it fetches, validates and commits the data to the branch it runs on; it also runs on a push that changes the ingestion script while the data is missing), or
- run `npm run fetch:moon` locally with network access and commit `src/data/astronomy/december-2026.json`. A downloaded copy also works: `npm run fetch:moon -- path/to/mooninfo_2026.json`.

If the file is ever reset to `"status": "missing"`, the panel says the NASA data has not been fetched and shows no numbers.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` runs on every push to `main` (and on pull requests without deploying): checkout, Node setup, `npm ci`, content validation, typecheck, lint, tests, build, configure Pages, upload the `dist` artifact and deploy with the official `actions/deploy-pages`.

One-time setting: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

All asset URLs are built under `/jolastjornuspa/` (Vite `base`), and the favicon is referenced relatively, so nothing assumes the site is at the domain root.

## Accessibility and motion

- Semantic landmarks and headings, real buttons, visible focus, skip link, polite live regions for copy confirmation and date changes.
- Zodiac selection and the December path are fully keyboard operable (Tab plus arrow keys, Home/End); locked days are disabled and labelled "læstur".
- Decorative canvases and stars are hidden from assistive technology; meaningful SVGs have labels.
- `prefers-reduced-motion`: no nebula rotation or zoom (a still frame and a short fade), no twinkling or shooting stars, no line drawing; everything works the same.
- The intro plays once per browser tab session (`sessionStorage`), and "Sleppa inngangi" skips it.

## Privacy

No personal data is collected. The only browser storage is one `sessionStorage` flag remembering that the intro has already played in this tab.
