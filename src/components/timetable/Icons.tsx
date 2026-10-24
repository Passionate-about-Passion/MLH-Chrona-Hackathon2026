type IconProps = { size?: number };

const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export function PinIcon({ size = 14 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function RepeatIcon({ size = 14 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </svg>
  );
}

export function LockIcon({ size = 14 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function PlusIcon({ size = 24 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MicIcon({ size = 28 }: IconProps) {
  return (
    <svg {...svg(size)}>
      {/* filled capsule like SF Symbols "mic.fill" */}
      <rect x="8.5" y="2.5" width="7" height="12.5" rx="3.5" fill="currentColor" stroke="none" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M9 21h6" />
    </svg>
  );
}

/** SF Symbols "waveform": shown while recording */
export function WaveformIcon({ size = 24 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M3 10v4M6.5 7v10M10 4v16M13.5 8v8M17 5.5v13M20.5 10v4" />
    </svg>
  );
}

export function CalendarIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function BookIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </svg>
  );
}

export function SendIcon({ size = 20 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg {...svg(size)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
