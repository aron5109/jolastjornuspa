import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { hasSeenIntro, markIntroSeen } from './utils/introStorage';
import { buildSearch, readUrlState } from './utils/url';

/** How long the selected constellation glows before the forecast replaces the selector. */
const SELECT_ANIMATION_MS = 700;

type View = { sign: ZodiacId | null; date: string | null };

function readView(search: string, defaultDate: string | null): View {
  const state = readUrlState(search);
  const today = resolveToday(search);
  const date = state.date && isDateUnlocked(state.date, today) ? state.date : defaultDate;
  return { sign: state.sign, date };
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

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
    if (phase === 'after') return 'Jólastjörnuspá 2026. Allir dagar desember eru opnir til að fletta.';
    return `Í dag er ${formatDateIs(today)}.`;
  }, [phase, today]);

  return (
    <div className={`app phase-${phase}${variant !== 'default' ? ` day-${variant}` : ''}`}>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop-nebula" />
        <StarField reducedMotion={reducedMotion} variant={variant} paused={showIntro} />
      </div>

      <div className="page" inert={showIntro}>
        <a className="skip-link" href="#main">
          Fara beint í efnið
        </a>
        <header className="site-header">
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
              <p className="eyebrow">
                <span>Jólastjörnuspá</span>
                <span aria-hidden="true"> · </span>
                <span>{selectedDate ? formatDateIs(selectedDate) : ''}</span>
              </p>
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
            <strong>Til gamans gert.</strong> Jólastjörnuspáin er skáldskapur fyrir starfsfólk í desember.
          </p>
          <p>
            Himininn í dag byggir á stjörnufræðilegum gögnum frá NASA og tengist spánni ekki. Engar vafrakökur, engin
            rakning.
          </p>
        </footer>
      </div>

      {showIntro ? <NebulaIntro reducedMotion={reducedMotion} onDone={finishIntro} /> : null}
    </div>
  );
}
