'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  foil?: boolean;
  priority?: boolean;
  maxTilt?: number;
  className?: string;
  sizes?: string;
  children?: React.ReactNode;
}

export function TiltCard({ src, alt, width, height, foil = false, priority = false, maxTilt = 12, className = '', sizes, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (reduce || !el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * maxTilt * 2}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * maxTilt * 2}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <div className={`[perspective:1000px] ${className}`}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative overflow-hidden rounded-[4.5%] shadow-[0_30px_80px_-20px_rgba(212,175,55,0.35)] transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      >
        <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes={sizes} className="h-auto w-full rounded-[4.5%]" />
        {foil && <div className="foil-overlay motion-reduce:hidden" />}
        {children}
      </div>
    </div>
  );
}
