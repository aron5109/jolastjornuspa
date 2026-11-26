import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { DecemberNavigator } from './components/DecemberNavigator';
import { HoroscopeView } from './components/HoroscopeView';
import { NebulaIntro } from './components/NebulaIntro';
import { SkyToday } from './components/SkyToday';
import { StarField, type StarFieldVariant } from './components/StarField';
import { Teaser } from './components/Teaser';
import { ZodiacInfo } from './components/ZodiacInfo';
import { ZodiacSelector } from './components/ZodiacSelector';
import { StarMark } from './components/icons';
import { getSign } from './data/signs';
import { DESKTOP_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { useReducedMotion } from './hooks/useReducedMotion';
import type { ZodiacId } from './types';
import { dayOfMonth, formatDateIs, isDateUnlocked, latestUnlockedDate, resolveToday, sitePhase } from './utils/dates';
import { getHoroscope } from './utils/horoscope';
import { detectEmbedded } from './utils/embed';
import { hasSeenIntro, markIntroSeen } from './utils/introStorage';
import { MOON_DATA } from './utils/moon';
import { buildSearch, readUrlState } from './utils/url';

/** How long the selected constellation glows before the forecast replaces the selector. */
const SELECT_ANIMATION_MS = 700;

type View = { sign: ZodiacId | null; date: string | null };

/** Embedded reading tabs: the forecast, the sign's traditional associations, and the real sky. */
type Panel = 'forecast' | 'sign' | 'sky';
const PANELS: [Panel, string][] = [
  ['forecast', 'Spáin'],
  ['sign', 'Um merkið'],
  ['sky', 'Himinninn í dag'],
];

function readView(search: string, defaultDate: string | null): View {
  const state = readUrlState(search);
  const today = resolveToday(search);
  const date = state.date && isDateUnlocked(state.date, today) ? state.date : defaultDate;
  return { sign: state.sign, date };
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [embedded] = useState(() => detectEmbedded());
  const [panel, setPanel] = useState<Panel>('forecast');
  const tabRefs = useRef<Record<Panel, HTMLButtonElement | null>>({ forecast: null, sign: null, sky: null });

  useEffect(() => {
    document.documentElement.classList.toggle('is-embedded', embedded);
  }, [embedded]);

  // The effective day is fixed for the page view; previewDate is read only inside utils/dates.
  const [today] = useState(() => resolveToday(window.location.search));
  const phase = sitePhase(today);
  const defaultDate = latestUnlockedDate(today);

  const [view, setView] = useState<View>(() => readView(window.location.search, defaultDate));
  const [pendingSign, setPendingSign] = useState<ZodiacId | null>(null);
  const [showIntro, setShowIntro] = useState(() => !hasSeenIntro());
  const introPlayed = useRef(showIntro);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const focusForecast = useRef(false);
  const pendingTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(pendingTimer.current), []);

  useEffect(() => {
    const onPopState = () => setView(readView(window.location.search, defaultDate));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultDate]);

  const commit = useCallback(
    (next: View, mode: 'push' | 'replace') => {
      setView(next);
      const search = buildSearch(window.location.search, next, defaultDate);
      const url = `${window.location.pathname}${search}${window.location.hash}`;
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    },
    [defaultDate],
  );

  const selectSign = (sign: ZodiacId) => {
    setPendingSign(sign);
    window.clearTimeout(pendingTimer.current);
    pendingTimer.current = window.setTimeout(
      () => {
        setPendingSign(null);
        setPanel('forecast');
        focusForecast.current = true;
        commit({ sign, date: view.date ?? defaultDate }, 'push');
      },
      reducedMotion ? 0 : SELECT_ANIMATION_MS,
    );
  };

  const chooseAnother = () => {
    commit({ sign: null, date: view.date }, 'push');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const selectDate = (date: string) => {
    if (!isDateUnlocked(date, today)) return;
    commit({ ...view, date }, 'replace');
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = PANELS.findIndex(([id]) => id === panel);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % PANELS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + PANELS.length) % PANELS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = PANELS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const id = PANELS[next][0];
    setPanel(id);
    tabRefs.current[id]?.focus();
  };

  const finishIntro = useCallback(() => {
    markIntroSeen();
    setShowIntro(false);
  }, []);

  // Move focus to the forecast heading after choosing a sign, for keyboard and screen reader users.
  useEffect(() => {
    if (focusForecast.current && view.sign) {
      focusForecast.current = false;
      document.getElementById('forecast-title')?.focus();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [view.sign]);

  // Return focus to the page heading when the intro closes.
  useEffect(() => {
    if (!showIntro && introPlayed.current) {
      introPlayed.current = false;
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [showIntro]);

  const selectedDate = view.date ?? defaultDate;
  const sign = view.sign ? getSign(view.sign) : null;
  const horoscope = sign && selectedDate ? getHoroscope(selectedDate, sign.id) : null;
  const day = selectedDate ? dayOfMonth(selectedDate) : 0;
  const variant: StarFieldVariant =
    phase === 'before' ? 'default' : day === 24 ? 'eve' : day === 31 ? 'nye' : 'default';

  const subtitle = useMemo(() => {
    if (phase === 'before') return 'Hvað segja stjörnurnar um desember hjá þér?';
    if (phase === 'after') return 'Allir dagar desember eru opnir til að fletta.';
    return `Í dag er ${formatDateIs(today)}.`;
  }, [phase, today]);

  return (
    <div className={`app phase-${phase}${variant !== 'default' ? ` day-${variant}` : ''}${embedded ? ' is-embedded' : ''}`}>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop-nebula" />
        <StarField reducedMotion={reducedMotion} variant={variant} paused={showIntro} />
      </div>

      <div className="page" inert={showIntro}>
        <a className="skip-link" href="#main">
          Fara beint í efnið
        </a>
        <header className={`site-header${embedded ? ' visually-hidden' : ''}`}>
          <StarMark className="site-mark" />
          <div>
            <h1 className="site-title" ref={headingRef} tabIndex={-1}>
              Jólastjörnuspá{phase === 'after' ? ' 2026' : ''}
            </h1>
            <p className="site-subtitle">{subtitle}</p>
          </div>
        </header>

        <main id="main" className="main">
          {phase === 'before' ? (
            <Teaser today={today} />
          ) : sign && horoscope && selectedDate && embedded ? (
            <div className="reading is-tabbed">
              <div className="reading-nav">
                <DecemberNavigator
                  today={today}
                  selectedDate={selectedDate}
                  onSelect={selectDate}
                  layout={isDesktop ? 'path' : 'compact'}
                />
              </div>
              <div className="reading-tabs-row">
              <div className="reading-tabs" role="tablist" aria-label={`Spá fyrir ${sign.name}`}>
                {PANELS.map(([id, label]) => (
                  <button
                    key={id}
                    ref={(element) => {
                      tabRefs.current[id] = element;
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${id}`}
                    className="reading-tab"
                    aria-selected={panel === id}
                    aria-controls="reading-panel"
                    tabIndex={panel === id ? 0 : -1}
                    onClick={() => setPanel(id)}
                    onKeyDown={onTabKeyDown}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="reading-date">{formatDateIs(selectedDate)}</p>
              </div>
              <div className="reading-panel" id="reading-panel" role="tabpanel" aria-labelledby={`tab-${panel}`}>
                {panel === 'forecast' ? (
                  <HoroscopeView
                    sign={sign}
                    horoscope={horoscope}
                    reducedMotion={reducedMotion}
                    onChooseAnother={chooseAnother}
                  />
                ) : panel === 'sign' ? (
                  <ZodiacInfo key={sign.id} sign={sign} collapsible={false} />
                ) : (
                  <div className="sky-panel">
                    <SkyToday date={selectedDate} />
                    <p className="sky-source">
                      Byggt á gögnum frá NASA (
                      <a href={MOON_DATA.source.landingPage} target="_blank" rel="noopener noreferrer">
                        Scientific Visualization Studio, Moon Phase and Libration
                        <span className="visually-hidden"> (opnast í nýjum flipa)</span>
                      </a>
                      ). Tengist spánni ekki.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : sign && horoscope && selectedDate ? (
            <div className="reading">
              <div className="reading-nav">
                <DecemberNavigator
                  today={today}
                  selectedDate={selectedDate}
                  onSelect={selectDate}
                  layout={isDesktop ? 'path' : 'compact'}
                />
              </div>
              <div className="reading-main">
                <HoroscopeView
                  sign={sign}
                  horoscope={horoscope}
                  reducedMotion={reducedMotion}
                  onChooseAnother={chooseAnother}
                />
              </div>
              <div className="reading-side">
                <ZodiacInfo key={sign.id} sign={sign} collapsible={!isDesktop} />
              </div>
              <div className="reading-sky">
                <SkyToday date={selectedDate} />
              </div>
            </div>
          ) : (
            <section className="choose" aria-labelledby="choose-title">
              <p className="eyebrow">{selectedDate ? formatDateIs(selectedDate) : ''}</p>
              <h2 id="choose-title" className="choose-title">
                Veldu stjörnumerkið þitt
              </h2>
              <p className="choose-text">Ný spá fyrir hvert merki, á hverjum degi í desember.</p>
              <ZodiacSelector orbital={isDesktop} pendingSign={pendingSign} onSelect={selectSign} />
            </section>
          )}
        </main>

        <footer className="site-footer">
          <p>
            <strong>Til gamans gert.</strong> Jólastjörnuspáin er skáldskapur og afþreying, ekki ráðgjöf.
          </p>
          <p className="footer-source">
            Himinninn í dag byggir á stjörnufræðilegum gögnum frá NASA og tengist spánni ekki. (
            <a href={MOON_DATA.source.landingPage} target="_blank" rel="noopener noreferrer">
              Scientific Visualization Studio, Moon Phase and Libration
              <span className="visually-hidden"> (opnast í nýjum flipa)</span>
            </a>
            )
          </p>
          <p>Engar vafrakökur, engin rakning.</p>
        </footer>
      </div>

      {showIntro ? <NebulaIntro reducedMotion={reducedMotion} onDone={finishIntro} /> : null}
    </div>
  );
}
