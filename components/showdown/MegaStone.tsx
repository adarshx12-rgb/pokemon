import { useId } from 'react';

/** A Mega Stone: a glowing marble with a two-colour swirl. Decorative; the button around it carries the label. */
export function MegaStone({ size = 20 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}-glass`} cx="36%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#f3e6ff" />
          <stop offset="0.75" stopColor="#b98ce8" />
          <stop offset="1" stopColor="#6d3fb0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id}-glass)`} stroke="#4a2a7a" strokeWidth="1.2" />
      <path d="M6.5 15.5c2.2-.6 3.2-3.4 5-5.4s3.9-2.3 5.6-1.4" fill="none" stroke="#ff5a36" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 8.4c1.4 1.7 3.2 2 5 3.1s2.8 3.1 4.6 4.1" fill="none" stroke="#2fa8ff" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="8.6" cy="7.4" rx="2.3" ry="1.3" fill="#ffffff" opacity="0.85" transform="rotate(-25 8.6 7.4)" />
    </svg>
  );
}
