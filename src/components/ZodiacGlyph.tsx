import type { ZodiacId } from '../types';

/**
 * Custom line-drawn zodiac glyphs (24×24, stroke-based) so the symbols never fall back to
 * platform emoji. Decorative: the sign name is always present as text next to them.
 */
const GLYPHS: Record<ZodiacId, string> = {
  hrutur:
    'M12 21V10 M12 10C12 5.5 10 3.5 7.3 3.5 4.8 3.5 3 5.4 3 7.6 3 9.6 4.5 11 6.3 11 M12 10C12 5.5 14 3.5 16.7 3.5 19.2 3.5 21 5.4 21 7.6 21 9.6 19.5 11 17.7 11',
  naut: 'M3.5 3.5C4.5 7 7.7 9.5 12 9.5S19.5 7 20.5 3.5 M17.5 15a5.5 5.5 0 1 1-11 0a5.5 5.5 0 1 1 11 0Z',
  tviburar: 'M4 3.5C9 5.3 15 5.3 20 3.5 M4 20.5C9 18.7 15 18.7 20 20.5 M9 4.8V19.2 M15 4.8V19.2',
  krabbi:
    'M21 9C19.5 5.6 16.3 4 12.3 4 8.6 4 5.6 5.3 4 7.4 M3 15C4.5 18.4 7.7 20 11.7 20 15.4 20 18.4 18.7 20 16.6 M9.5 9a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0Z M19.5 15a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0Z',
  ljon: 'M9.5 16a2.75 2.75 0 1 1-5.5 0a2.75 2.75 0 1 1 5.5 0Z M9.5 16C9.5 11.5 7.8 9.6 7.8 7 7.8 4.8 9.6 3 12 3S16.2 4.8 16.2 7C16.2 10.4 13 12.8 13 17.2 13 19 14.2 20.5 16 20.5 17.6 20.5 18.8 19.5 20.5 18',
  meyja:
    'M3 6.5C4.5 6.5 5.5 7.6 5.5 9.2V18 M5.5 9.2C5.5 7.4 6.6 6.3 8 6.3S10.5 7.4 10.5 9.2V18 M10.5 9.2C10.5 7.4 11.6 6.3 13 6.3S15.5 7.4 15.5 9.2V16.2C15.5 18.6 17 20.2 19.5 21 M15.5 13.2C16.4 11.4 18 10.5 19.3 10.9 20.9 11.4 21 13.8 19.6 15.7 18.6 17.1 17 18.2 15.8 18.8',
  vog: 'M3 20H21 M3 16H8.6C7.6 15 7 13.6 7 12.1 7 9.3 9.2 7 12 7S17 9.3 17 12.1C17 13.6 16.4 15 15.4 16H21',
  sporddreki:
    'M3 6.5C4.5 6.5 5.5 7.6 5.5 9.2V18 M5.5 9.2C5.5 7.4 6.6 6.3 8 6.3S10.5 7.4 10.5 9.2V18 M10.5 9.2C10.5 7.4 11.6 6.3 13 6.3S15.5 7.4 15.5 9.2V17C15.5 18.7 16.6 19.6 18.2 19.6H21 M19 17.4L21.2 19.6 19 21.8',
  bogmadur: 'M4 20L20 4 M12.5 4H20V11.5 M7 11L13 17',
  steingeit:
    'M3 5.5C4.6 5.5 5.6 6.6 6.1 8.6L8.6 18 11.6 7.4C12.2 5.4 13.2 4.5 14.5 4.5 16 4.5 17 5.7 17 7.6V15.4 M21.5 15.5a2.5 2.5 0 1 1-5 0 M16.5 15.5C16.5 18.5 14.6 20.6 11.5 21',
  vatnsberi: 'M3 10.2L6 7.2 9 10.2 12 7.2 15 10.2 18 7.2 21 10.2 M3 16.8L6 13.8 9 16.8 12 13.8 15 16.8 18 13.8 21 16.8',
  fiskar: 'M5.5 3C9.3 6.2 9.3 17.8 5.5 21 M18.5 3C14.7 6.2 14.7 17.8 18.5 21 M4 12H20',
};

type Props = {
  sign: ZodiacId;
  className?: string;
};

export function ZodiacGlyph({ sign, className }: Props) {
  return (
    <svg
      className={['zodiac-glyph', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GLYPHS[sign]} />
    </svg>
  );
}
