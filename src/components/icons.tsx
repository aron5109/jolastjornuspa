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

/** Four-point star with a small sparkle, the site's mark. */
export function StarMark({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5C12.6 8 14 9.6 19.5 10.2 14 10.8 12.6 12.4 12 18 11.4 12.4 10 10.8 4.5 10.2 10 9.6 11.4 8 12 2.5Z" />
      <path d="M18.5 16.5V21 M16.3 18.8H20.8" />
    </svg>
  );
}

/** Vinnan: a compass-like orbit. */
export function WorkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7 M3.5 12.5H20.5 M12 11.5V13.5" />
    </svg>
  );
}

/** Jólin: a tree-topper star above a soft light. */
export function ChristmasIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3L13.4 6.2 16.8 6.5 14.2 8.7 15 12 12 10.2 9 12 9.8 8.7 7.2 6.5 10.6 6.2Z" />
      <path d="M12 13.5L6 21H18Z" />
    </svg>
  );
}

/** Heppnin: a shooting star. */
export function LuckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15.5 4L16.6 6.9 19.5 8 16.6 9.1 15.5 12 14.4 9.1 11.5 8 14.4 6.9Z" />
      <path d="M11 13L4 20 M13 16L8.5 20.5 M8 11L3.5 15.5" />
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
