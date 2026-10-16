import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { SIGNS } from '../data/signs';
import type { ZodiacId } from '../types';
import { ZodiacConstellation } from './ZodiacConstellation';
import { ZodiacGlyph } from './ZodiacGlyph';
import { StarMark } from './icons';

type Props = {
  orbital: boolean;
  /** The sign currently animating into its forecast, if any. */
  pendingSign: ZodiacId | null;
  onSelect: (sign: ZodiacId) => void;
};

/**
 * All twelve signs as real buttons. Desktop arranges them on an orbit around a centre that
 * previews the hovered or focused constellation; small screens get a simple, roomy grid.
 * Arrow keys move between signs in addition to Tab.
 */
export function ZodiacSelector({ orbital, pendingSign, onSelect }: Props) {
  const [previewId, setPreviewId] = useState<ZodiacId | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const preview = SIGNS.find((sign) => sign.id === (pendingSign ?? previewId)) ?? null;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in keys) next = (index + keys[event.key] + SIGNS.length) % SIGNS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SIGNS.length - 1;
    if (next === null) return;
    event.preventDefault();
    buttonRefs.current[next]?.focus();
  };

  return (
    <div className={`zodiac-selector ${orbital ? 'is-orbital' : 'is-grid'}${pendingSign ? ' has-pending' : ''}`}>
      {orbital ? (
        <div className="orbit-centre" aria-hidden="true">
          <svg className="orbit-rings" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="98" />
            <circle cx="100" cy="100" r="56" />
            <circle cx="100" cy="100" r="44" className="orbit-ring-faint" />
            {Array.from({ length: 12 }, (_, i) => {
              // Ticks sit between the signs so they never cross a constellation.
              const angle = (i * 30 - 75) * (Math.PI / 180);
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(angle) * 56}
                  y1={100 + Math.sin(angle) * 56}
                  x2={100 + Math.cos(angle) * 62}
                  y2={100 + Math.sin(angle) * 62}
                />
              );
            })}
          </svg>
          <div className="orbit-preview">
            {preview ? (
              <>
                <ZodiacConstellation sign={preview} active className="orbit-preview-art" />
                <p className="orbit-preview-name">{preview.name}</p>
                <p className="orbit-preview-range">{preview.dateRange}</p>
              </>
            ) : (
              <>
                <StarMark className="orbit-star" />
                <p className="orbit-preview-hint">Veldu merki</p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <ul className="zodiac-list" aria-label="Stjörnumerkin tólf">
        {SIGNS.map((sign, index) => {
          const isPending = pendingSign === sign.id;
          return (
            <li key={sign.id} className="zodiac-item" style={{ '--i': index } as CSSProperties}>
              <button
                ref={(element) => {
                  buttonRefs.current[index] = element;
                }}
                type="button"
                className={`zodiac-button${isPending ? ' is-selected' : ''}`}
                onClick={() => onSelect(sign.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onMouseEnter={() => setPreviewId(sign.id)}
                onMouseLeave={() => setPreviewId((current) => (current === sign.id ? null : current))}
                onFocus={() => setPreviewId(sign.id)}
                onBlur={() => setPreviewId((current) => (current === sign.id ? null : current))}
                disabled={pendingSign !== null && !isPending}
                aria-pressed={isPending}
              >
                <ZodiacConstellation sign={sign} active={isPending} className="zodiac-button-art" />
                <span className="zodiac-button-text">
                  <ZodiacGlyph sign={sign.id} className="zodiac-button-glyph" />
                  <span className="zodiac-button-name">{sign.name}</span>
                  <span className="zodiac-button-range">{sign.dateRange}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
