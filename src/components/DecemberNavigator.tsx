import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { dayOfMonth, DECEMBER_DATES, formatDateIs, isDateUnlocked, shiftDate, weekdayIs } from '../utils/dates';
import { CalendarIcon, ChevronLeft, ChevronRight, LockIcon } from './icons';

type Props = {
  today: string;
  selectedDate: string;
  onSelect: (date: string) => void;
  /** Desktop: 31-star celestial path. Phones: previous/next plus an expandable month grid. */
  layout: 'path' | 'compact';
};

function dayLabel(date: string, today: string, selected: string): string {
  const parts = [`${formatDateIs(date, false)}, ${weekdayIs(date)}`];
  if (date === today) parts.push('í dag');
  if (date === selected) parts.push('valinn');
  if (!isDateUnlocked(date, today)) parts.push('læstur, opnast síðar');
  return parts.join(', ');
}

function specialClass(date: string): string {
  const day = dayOfMonth(date);
  if (day === 24) return ' is-eve';
  if (day === 31) return ' is-nye';
  return '';
}

/** Position of each star on the desktop path, in percent of the container. */
function pathPoint(index: number) {
  const x = 2.5 + (index * 95) / 30;
  const y = 50 + Math.sin(index * 0.62 + 0.4) * 26 + Math.sin(index * 1.7) * 6;
  return { x, y };
}

function CelestialPath({ today, selectedDate, onSelect }: Omit<Props, 'layout'>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const points = DECEMBER_DATES.map((_, index) => pathPoint(index));
  const unlocked = DECEMBER_DATES.filter((date) => isDateUnlocked(date, today));
  const lastUnlockedIndex = unlocked.length - 1;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const index = unlocked.indexOf(date);
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(index + 1, lastUnlockedIndex);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(index - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = lastUnlockedIndex;
    if (next === null) return;
    event.preventDefault();
    const target = unlocked[next];
    onSelect(target);
    refs.current[DECEMBER_DATES.indexOf(target)]?.focus();
  };

  return (
    <div className="celestial-path" role="group" aria-label="Dagar í desember. Örvatakkar fletta á milli opinna daga.">
      <svg className="celestial-path-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          className="celestial-path-line"
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          className="celestial-path-line is-travelled"
          points={points
            .slice(0, Math.max(1, lastUnlockedIndex + 1))
            .map((p) => `${p.x},${p.y}`)
            .join(' ')}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {DECEMBER_DATES.map((date, index) => {
        const open = isDateUnlocked(date, today);
        const isSelected = date === selectedDate;
        const { x, y } = points[index];
        return (
          <button
            key={date}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            className={`path-star${open ? '' : ' is-locked'}${isSelected ? ' is-selected' : ''}${
              date === today ? ' is-today' : ''
            }${specialClass(date)}`}
            style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties}
            disabled={!open}
            tabIndex={isSelected ? 0 : -1}
            aria-pressed={isSelected}
            aria-current={date === today ? 'date' : undefined}
            aria-label={dayLabel(date, today, selectedDate)}
            onClick={() => onSelect(date)}
            onKeyDown={(event) => onKeyDown(event, date)}
          >
            <span className="path-star-dot" aria-hidden="true" />
            <span className="path-star-number" aria-hidden="true">
              {dayOfMonth(date)}
            </span>
            {open ? null : <LockIcon className="path-star-lock" />}
          </button>
        );
      })}
    </div>
  );
}

const WEEKDAY_HEADERS: [string, string][] = [
  ['Má', 'mánudagur'],
  ['Þr', 'þriðjudagur'],
  ['Mi', 'miðvikudagur'],
  ['Fi', 'fimmtudagur'],
  ['Fö', 'föstudagur'],
  ['La', 'laugardagur'],
  ['Su', 'sunnudagur'],
];

function CompactNavigator({ today, selectedDate, onSelect }: Omit<Props, 'layout'>) {
  const [open, setOpen] = useState(false);
  const gridId = useId();
  const previous = shiftDate(selectedDate, -1);
  const next = shiftDate(selectedDate, 1);
  const hasPrevious = isDateUnlocked(previous, today);
  const nextExists = DECEMBER_DATES.includes(next);
  const hasNext = isDateUnlocked(next, today);
  // 1 December 2026 is a Tuesday; Monday-first grid offset.
  const firstWeekday = (new Date(Date.UTC(2026, 11, 1)).getUTCDay() + 6) % 7;

  return (
    <div className="compact-nav">
      <div className="compact-nav-row">
        <button
          type="button"
          className="compact-nav-step"
          onClick={() => onSelect(previous)}
          disabled={!hasPrevious}
          aria-label={hasPrevious ? `Fyrri dagur: ${formatDateIs(previous, false)}` : 'Enginn fyrri dagur'}
        >
          <ChevronLeft className="compact-nav-chevron" />
          <span className="compact-nav-neighbour" aria-hidden="true">
            {hasPrevious ? `${dayOfMonth(previous)}. des.` : ''}
          </span>
        </button>
        <p className="compact-nav-current" aria-live="polite">
          <span className="compact-nav-date">{formatDateIs(selectedDate, false)}</span>
          <span className="compact-nav-weekday">{selectedDate === today ? 'Í dag' : weekdayIs(selectedDate)}</span>
        </p>
        <button
          type="button"
          className={`compact-nav-step is-next${!hasNext && nextExists ? ' is-locked' : ''}`}
          onClick={() => onSelect(next)}
          disabled={!hasNext}
          aria-label={
            hasNext
              ? `Næsti dagur: ${formatDateIs(next, false)}`
              : nextExists
                ? `Næsti dagur, ${formatDateIs(next, false)}, er læstur`
                : 'Enginn næsti dagur'
          }
        >
          <span className="compact-nav-neighbour" aria-hidden="true">
            {nextExists ? `${dayOfMonth(next)}. des.` : ''}
          </span>
          {!hasNext && nextExists ? (
            <LockIcon className="compact-nav-chevron" />
          ) : (
            <ChevronRight className="compact-nav-chevron" />
          )}
        </button>
      </div>

      <button
        type="button"
        className="disclosure-button compact-nav-toggle"
        aria-expanded={open}
        aria-controls={gridId}
        onClick={() => setOpen((value) => !value)}
      >
        <CalendarIcon className="action-icon" />
        {open ? 'Loka dagatali' : 'Skoða desember'}
      </button>

      <div id={gridId} className="month-grid" hidden={!open}>
        <div className="month-grid-head" aria-hidden="true">
          {WEEKDAY_HEADERS.map(([short]) => (
            <span key={short}>{short}</span>
          ))}
        </div>
        <ul className="month-grid-days" aria-label="Dagar í desember">
          {DECEMBER_DATES.map((date, index) => {
            const unlocked = isDateUnlocked(date, today);
            const isSelected = date === selectedDate;
            return (
              <li key={date} style={index === 0 ? { gridColumnStart: firstWeekday + 1 } : undefined}>
                <button
                  type="button"
                  className={`month-day${unlocked ? '' : ' is-locked'}${isSelected ? ' is-selected' : ''}${
                    date === today ? ' is-today' : ''
                  }${specialClass(date)}`}
                  disabled={!unlocked}
                  aria-pressed={isSelected}
                  aria-current={date === today ? 'date' : undefined}
                  aria-label={dayLabel(date, today, selectedDate)}
                  onClick={() => {
                    onSelect(date);
                    setOpen(false);
                  }}
                >
                  <span aria-hidden="true">{dayOfMonth(date)}</span>
                  {unlocked ? null : <LockIcon className="month-day-lock" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function DecemberNavigator(props: Props) {
  const { layout, ...rest } = props;
  return (
    <nav className="december-nav" aria-label="Velja dag í desember">
      {layout === 'path' ? <CelestialPath {...rest} /> : <CompactNavigator {...rest} />}
    </nav>
  );
}
