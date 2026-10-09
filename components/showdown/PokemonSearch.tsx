'use client';
import { useMemo, useState } from 'react';
import { displayName, toSlug } from '@/lib/pokeapi/names';

interface Props { side: 'A' | 'B'; names: string[]; disabled: boolean; onPick: (slug: string) => void }

export function PokemonSearch({ side, names, disabled, onPick }: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = toSlug(query);
    if (!q) return [];
    const starts = names.filter(n => n.startsWith(q));
    const contains = names.filter(n => !n.startsWith(q) && n.includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [query, names]);

  const pick = (slug: string) => { onPick(slug); setQuery(''); };

  return (
    <div className="relative">
      <input
        data-testid={`search-${side}`}
        value={query}
        disabled={disabled}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && results[0]) pick(results[0]); }}
        placeholder={disabled ? 'Team is full' : 'Search Pokémon…'}
        aria-label={side === 'A' ? 'Add a Pokémon to your team' : 'Add a Pokémon to the opponent team'}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`search-${side}-list`}
        className="w-full rounded-full border border-line bg-ink px-5 py-3 text-sm outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-40"
      />
      {results.length > 0 && (
        <ul id={`search-${side}-list`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          {results.map(slug => (
            <li key={slug} role="option" aria-selected={false} onClick={() => pick(slug)}
              className="cursor-pointer px-5 py-2.5 text-sm transition hover:bg-gold/10 hover:text-gold-light">
              {displayName(slug)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
