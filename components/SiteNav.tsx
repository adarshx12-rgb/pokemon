import Link from 'next/link';

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 mix-blend-difference md:px-16">
      <Link href="/" className="whitespace-nowrap font-display text-xl tracking-wide text-gold-light md:text-2xl">
        Pokémon <span className="emph text-gold-gradient">Vault</span>
      </Link>
      <nav className="flex gap-5 whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-cream md:gap-8 md:text-xs md:tracking-[0.3em]">
        <Link href="/cards" className="transition hover:text-gold-light">The Vault</Link>
        <Link href="/showdown" className="transition hover:text-gold-light">Showdown</Link>
      </nav>
    </header>
  );
}
