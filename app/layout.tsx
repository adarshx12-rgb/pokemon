import type { Metadata } from 'next';
import { Dela_Gothic_One, Press_Start_2P, Zen_Kaku_Gothic_New } from 'next/font/google';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { MarbleBackground } from '@/components/motion/MarbleBackground';
import { InkDefs } from '@/components/manga/InkDefs';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

// Japanese fonts ship ~120 unicode-range slices each and next/font would preload every one (~3 MB before
// first paint). Without preload, the browser fetches only the slices a page actually uses.
const dela = Dela_Gothic_One({ subsets: ['latin'], weight: '400', variable: '--font-dela', preload: false });
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-zen-kaku', preload: false });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  title: 'Pokémon Vault',
  description: 'Rare Pokémon cards ranked by rarity with estimated prices, and a stat-driven Pokémon Showdown.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dela.variable} ${zenKaku.variable} ${pixel.variable}`}>
      {/* No body background: the html element paints ink, so the fixed marble layer (z -10) shows through. */}
      <body className="min-h-screen text-cream antialiased">
        <InkDefs />
        <MarbleBackground />
        <SmoothScroll>
          <SiteNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
