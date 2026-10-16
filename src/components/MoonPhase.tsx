import { useId } from 'react';

type Props = {
  /** 0–100, or null when no data is available. */
  illumination: number | null;
  waxing: boolean;
  label?: string;
};

const R = 46;
const C = 50;

/**
 * SVG Moon whose lit area follows the illuminated fraction. As seen from the northern
 * hemisphere the waxing Moon is lit on the right and the waning Moon on the left.
 */
export function MoonPhase({ illumination, waxing, label }: Props) {
  const id = useId();
  if (illumination === null) {
    return (
      <svg className="moon moon-empty" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx={C} cy={C} r={R} />
      </svg>
    );
  }
  const k = Math.min(1, Math.max(0, illumination / 100));
  const rx = Math.abs(1 - 2 * k) * R;
  const terminatorSweep = k > 0.5 ? 1 : 0;
  const lit = `M${C} ${C - R}A${R} ${R} 0 0 1 ${C} ${C + R}A${rx} ${R} 0 0 ${terminatorSweep} ${C} ${C - R}Z`;

  return (
    <svg className="moon" viewBox="0 0 100 100" role="img" aria-label={label} focusable="false">
      {label ? <title>{label}</title> : null}
      <defs>
        <radialGradient id={`${id}-lit`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="60%" stopColor="#efe6d2" />
          <stop offset="100%" stopColor="#c9bfae" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="60%" stopColor="rgba(247,243,234,0.18)" />
          <stop offset="100%" stopColor="rgba(247,243,234,0)" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={lit} transform={waxing ? undefined : `matrix(-1 0 0 1 ${C * 2} 0)`} />
        </clipPath>
      </defs>
      <circle cx={C} cy={C} r={R + 4} fill={`url(#${id}-halo)`} opacity={0.4 + k * 0.6} />
      <circle cx={C} cy={C} r={R} className="moon-dark" />
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx={C} cy={C} r={R} fill={`url(#${id}-lit)`} />
        <g className="moon-maria">
          <circle cx="38" cy="36" r="9" />
          <circle cx="58" cy="30" r="6" />
          <circle cx="62" cy="55" r="11" />
          <circle cx="40" cy="62" r="7" />
          <circle cx="30" cy="48" r="4" />
        </g>
      </g>
      <circle cx={C} cy={C} r={R} className="moon-rim" />
    </svg>
  );
}
