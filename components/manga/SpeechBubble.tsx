export function SpeechBubble({ children, tail = 'bottom', className = '' }: { children: React.ReactNode; tail?: 'bottom' | 'left' | 'right'; className?: string }) {
  return <div className={`speech-bubble speech-bubble--${tail} ${className}`}>{children}</div>;
}
