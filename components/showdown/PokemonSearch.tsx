'use client';
import { useMemo, useState } from 'react';
import { displayName, toSlug } from '@/lib/pokeapi/names';
import styles from './showdown.module.css';

interface Props { side: 'A' | 'B'; names: string[]; disabled: boolean; loading: boolean; onPick: (slug: string) => void }

export function PokemonSearch({ side, names, disabled, loading, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const q = toSlug(query);
    if (!q) return [];
    return [...names.filter(n => n.startsWith(q)), ...names.filter(n => !n.startsWith(q) && n.includes(q))].slice(0, 8);
  }, [query, names]);
  const expanded = open && !disabled && results.length > 0;
  const pick = (slug: string) => { if (disabled) return; onPick(slug); setQuery(''); setOpen(false); setActive(0); };
  return (
    <div className={styles.search}>
      <input id={`pokemon-search-${side}`} data-testid={`search-${side}`} value={query} disabled={disabled}
        onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (e.key === 'Escape') { setOpen(false); return; }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); setOpen(true);
            setActive(i => Math.max(0, Math.min(results.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))));
          }
          if (e.key === 'Enter' && expanded && results[active]) { e.preventDefault(); pick(results[active]); }
        }}
        placeholder={loading ? 'Loading from the Pokédex…' : disabled ? 'All 6 slots filled' : 'Search & add a Pokémon…'}
        aria-label={side === 'A' ? 'Add a Pokémon to your team' : 'Add a Pokémon to the opponent team'}
        role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={`search-${side}-list`}
        aria-activedescendant={expanded ? `search-${side}-option-${active}` : undefined} autoComplete="off" />
      {expanded && <ul id={`search-${side}-list`} role="listbox" aria-label="Pokémon results">
        {results.map((slug, i) => <li key={slug} id={`search-${side}-option-${i}`} role="option" aria-selected={active === i}
          onPointerDown={e => e.preventDefault()} onClick={() => pick(slug)} onPointerMove={() => setActive(i)}>{displayName(slug)}<span aria-hidden>+</span></li>)}
      </ul>}
      {open && query && !disabled && !results.length && <p className={styles.noResults} role="status">No Pokémon found. Try another name.</p>}
    </div>
  );
}
