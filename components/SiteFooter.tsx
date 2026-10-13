import Link from 'next/link';
import { SITE_PAGES } from '@/lib/site-pages';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div>
          <Link href="/" className={styles.brand}>POKEFAME</Link>
          <p>A closer look at the cards.<br />A new way to meet your favorites.</p>
        </div>
        <nav aria-label="Site information">
          <Link href="/#faq">Frequently asked questions</Link>
          {SITE_PAGES.map(page => <Link key={page.href} href={page.href}>{page.label}</Link>)}
        </nav>
      </div>
      <p className={styles.note}>Prices are dated estimates from TCGplayer and Cardmarket via the Pokémon TCG API. Pokémon stats and artwork from PokéAPI. pokefame is an independent fan project, not affiliated with Nintendo, Creatures, Game Freak, The Pokémon Company, or Pokémon Showdown. Pokémon names and artwork belong to their respective owners.</p>
    </footer>
  );
}
