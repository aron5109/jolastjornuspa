/** Fine-line icons drawn for this site. All decorative unless a label is passed by the caller. */
type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

/** Eight-point Christmas star, the site's mark. Solid, no sparkle. */
export function StarMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M12.00 2.00 L12.88 9.88 L16.24 7.76 L14.12 11.12 L22.00 12.00 L14.12 12.88 L16.24 16.24 L12.88 14.12 L12.00 22.00 L11.12 14.12 L7.76 16.24 L9.88 12.88 L2.00 12.00 L9.88 11.12 L7.76 7.76 L11.12 9.88Z" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5C8 5.3 9.8 3.5 12 3.5S16 5.3 16 7.5V10.5" />
    </svg>
  );
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 5.5L8 12 14.5 18.5" />
    </svg>
  );
}

export function ChevronRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 5.5L16 12 9.5 18.5" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8" />
    </svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 16L8.5 11.5 12.5 15 15 12.5 20.5 17.5 M15.5 8.5H15.6" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5V7 M12 17V20.5 M3.5 12H7 M17 12H20.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5H20.5 M8 3V6.5 M16 3V6.5" />
    </svg>
  );
}
