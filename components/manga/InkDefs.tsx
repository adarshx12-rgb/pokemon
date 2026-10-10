/** Shared SVG filters, rendered once in the root layout. `#ink-rough` makes straight strokes look brush-inked. */
export function InkDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
