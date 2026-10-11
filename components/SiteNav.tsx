'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'The Grail' },
  { href: '/cards', label: 'Vault' },
  { href: '/showdown', label: 'Showdown' },
] as const;

export function SiteNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-linear-to-b from-ink/90 to-transparent px-4 py-5 md:px-12">
      <Link href="/" className="whitespace-nowrap font-display text-lg uppercase tracking-wide text-red md:text-[22px]">
        Pokémon Vault
      </Link>
      <nav aria-label="Main" className="meta flex gap-5 whitespace-nowrap md:gap-11">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            className={isActive(link.href) ? 'text-red underline underline-offset-[6px]' : 'text-indigo transition hover:text-red'}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
