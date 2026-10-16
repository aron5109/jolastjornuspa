import type { CSSProperties } from 'react';
import { SIGNS } from '../data/signs';
import { daysUntilOpening } from '../utils/dates';
import { ZodiacGlyph } from './ZodiacGlyph';

type Props = {
  today: string;
};

/** Shown before 1 December 2026: the atmosphere without any forecast content. */
export function Teaser({ today }: Props) {
  const days = daysUntilOpening(today);
  return (
    <section className="teaser" aria-labelledby="teaser-title">
      <div className="teaser-ring" aria-hidden="true">
        {SIGNS.map((sign, index) => (
          <span key={sign.id} className="teaser-ring-sign" style={{ '--i': index } as CSSProperties}>
            <ZodiacGlyph sign={sign.id} />
          </span>
        ))}
      </div>
      <h2 id="teaser-title" className="teaser-title">
        Stjörnurnar eru að stilla sig af…
      </h2>
      <p className="teaser-text">Jólastjörnuspáin opnar 1. desember.</p>
      {days > 0 ? (
        <p className="teaser-countdown">
          <span className="teaser-countdown-number">{days}</span>{' '}
          {days % 10 === 1 && days % 100 !== 11 ? 'dagur' : 'dagar'} til stefnu
        </p>
      ) : null}
    </section>
  );
}
