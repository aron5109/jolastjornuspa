import { useId } from 'react';
import type { ZodiacSign } from '../types';

type Props = {
  sign: ZodiacSign;
  className?: string;
  /** Highlights the constellation and draws its lines. */
  active?: boolean;
  /** When set, the drawing is announced with this label; otherwise it is decorative. */
  label?: string;
};

const STAR_RADIUS = { 1: 1.6, 2: 2.3, 3: 3.1 } as const;

export function ZodiacConstellation({ sign, className, active = false, label }: Props) {
  const glowId = useId();
  const { stars, lines } = sign.constellation;
  return (
    <svg
      className={['constellation', active ? 'is-active' : '', className].filter(Boolean).join(' ')}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--star-core)" stopOpacity="1" />
          <stop offset="45%" stopColor="var(--star-glow)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--star-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="constellation-lines">
        {lines.map(([from, to]) => (
          <path
            key={`${from}-${to}`}
            d={`M${stars[from].x} ${stars[from].y}L${stars[to].x} ${stars[to].y}`}
            pathLength={1}
          />
        ))}
      </g>
      <g className="constellation-stars">
        {stars.map((star, index) => (
          <g key={index}>
            <circle
              className="constellation-halo"
              cx={star.x}
              cy={star.y}
              r={STAR_RADIUS[star.magnitude] * 3.2}
              fill={`url(#${glowId})`}
            />
            <circle cx={star.x} cy={star.y} r={STAR_RADIUS[star.magnitude]} />
          </g>
        ))}
      </g>
    </svg>
  );
}
