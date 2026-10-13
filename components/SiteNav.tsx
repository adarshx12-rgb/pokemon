'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteNav.module.css';

const LINKS = [
  { href: '/', label: 'The Grail' },
  { href: '/cards', label: 'Vault' },
  { href: '/showdown', label: 'Showdown' },
] as const;
/** Matches .door:focus-visible and .text-link:focus-visible. */
const RING = 'focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4';

export function SiteNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <header className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-linear-to-b from-ink/90 to-transparent px-4 py-5 md:px-12 ${styles.header}`}>
      <Link href="/" aria-current={path === '/' ? 'page' : undefined} className={`whitespace-nowrap font-display text-lg uppercase tracking-wide text-red md:text-[22px] ${RING}`}>
        HIPOKÉMON
      </Link>
      <nav aria-label="Main" className="meta flex gap-3 whitespace-nowrap min-[400px]:gap-5 md:gap-11">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            className={`${link.href === '/' ? styles.homeLink : ''} ${isActive(link.href) ? 'text-red underline underline-offset-[6px]' : 'text-indigo transition hover:text-red'} ${RING}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
