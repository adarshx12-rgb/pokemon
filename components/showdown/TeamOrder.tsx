'use client';
import { useRef, useState, type PointerEvent } from 'react';
import type { Side, TeamMember } from '@/lib/battle/types';
import { displayName } from '@/lib/pokeapi/names';
import { MAX_TEAM } from '@/lib/showdown/teams';
import { Pokeball } from './Pokeball';
import styles from './showdown.module.css';

interface Props {
  side: Side;
  team: TeamMember[];
  selected: number;
  disabled: boolean;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}

export function TeamOrder({ side, team, selected, disabled, onSelect, onReorder, onAdd }: Props) {
  const row = useRef<HTMLOListElement>(null);
  const gesture = useRef<{ from: number; to: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= team.length) return;
    onReorder(from, to);
    setAnnouncement(`${displayName(team[from].pokemon.name)} moved to position ${to + 1}.`);
    requestAnimationFrame(() => row.current?.querySelector<HTMLButtonElement>(`[data-order-index="${to}"]`)?.focus());
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g) return;
    if (!g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
    g.moved = true;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-order-index]');
    if (target && row.current?.contains(target)) {
      const index = Number(target.dataset.orderIndex);
      if (index < team.length) g.to = index;
    }
    setDrag({ from: g.from, to: g.to });
  };

  return (
    <>
      <ol ref={row} className={styles.teamOrder} aria-label={`${side === 'A' ? 'Your' : 'Opponent'} battle order`}>
        {Array.from({ length: MAX_TEAM }, (_, i) => {
          const member = team[i];
          return (
            <li key={i}>
              <button type="button" data-order-index={i} data-testid={member ? `slot-${side}-${i}` : `empty-${side}-${i}`}
                className={`${styles.orderSlot} ${member && selected === i ? styles.selectedSlot : ''} ${drag?.to === i ? styles.dropSlot : ''} ${drag?.from === i ? styles.dragSlot : ''}`}
                aria-label={member ? `${i + 1}. ${displayName(member.pokemon.name)}${i === 0 ? ', lead Pokémon' : ''}` : `Add Pokémon to ${side === 'A' ? 'your' : 'opponent'} team, slot ${i + 1}`}
                aria-pressed={member ? selected === i : undefined} aria-describedby={`order-help-${side}`} disabled={disabled}
                title={member ? `${displayName(member.pokemon.name)} — position ${i + 1}` : 'Add a Pokémon'}
                onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } if (member) onSelect(i); else onAdd(); }}
                onPointerDown={e => {
                  suppressClick.current = false;
                  if (!member || e.button !== 0) return;
                  gesture.current = { from: i, to: i, x: e.clientX, y: e.clientY, moved: false };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }} onPointerMove={move}
                onPointerUp={e => {
                  const g = gesture.current;
                  if (!g) return;
                  suppressClick.current = g.moved;
                  if (g.moved) reorder(g.from, g.to);
                  gesture.current = null; setDrag(null);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={() => { gesture.current = null; setDrag(null); }}
                onKeyDown={e => {
                  if (!member || !e.altKey || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                  e.preventDefault(); reorder(i, i + (e.key === 'ArrowLeft' ? -1 : 1));
                }}>
                <Pokeball filled={!!member} />
              </button>
            </li>
          );
        })}
      </ol>
      <p id={`order-help-${side}`} className="sr-only">Drag Poké Balls to set the order. Keyboard: Alt + left or right arrow. The first Poké Ball fights first.</p>
      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}
