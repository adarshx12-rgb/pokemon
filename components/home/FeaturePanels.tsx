import Link from 'next/link';
import { InkPanel } from '@/components/manga/InkPanel';
import { PanelReveal } from '@/components/manga/PanelReveal';
import { SHAPES } from '@/lib/manga/panel';

const FEATURES = [
  { href: '/cards', eyebrow: 'The Vault', title: 'From grail to common', body: 'A curated collection ranked by rarity tier, with estimated market prices refreshed daily and a guide to spotting what makes a card valuable.', shape: SHAPES.wedgeL, dir: 'left' as const },
  { href: '/showdown', eyebrow: 'Showdown', title: 'Six against six', body: 'Build two teams, then watch them battle on a Gen 2-style screen, decided by stats, speed, and type matchups.', shape: SHAPES.wedgeR, dir: 'right' as const },
];

export function FeaturePanels() {
  return (
    <section className="grid gap-3 px-4 py-16 md:grid-cols-2 md:px-10">
      {FEATURES.map(f => (
        <PanelReveal key={f.href} dir={f.dir}>
          <InkPanel shape={f.shape} className="group h-full">
            <div aria-hidden className="speed-lines absolute inset-0 scale-90 opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100" />
            <Link href={f.href} className="relative block p-10 transition duration-500 group-hover:scale-[1.02] md:p-16">
              <p className="caption-box">{f.eyebrow}</p>
              <h2 className="mt-6 font-display text-4xl transition group-hover:text-gold-light md:text-5xl">{f.title}</h2>
              <p className="mt-6 max-w-md text-muted">{f.body}</p>
              <span className="speech-bubble speech-bubble--left mt-10 text-sm">Explore</span>
            </Link>
          </InkPanel>
        </PanelReveal>
      ))}
    </section>
  );
}
