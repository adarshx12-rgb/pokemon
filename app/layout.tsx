import type { Metadata } from 'next';
import { Anton, JetBrains_Mono, Press_Start_2P } from 'next/font/google';
import { MeshBackground } from '@/components/grail/MeshBackground';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  title: 'Pokémon Vault',
  description: 'Rare Pokémon cards ranked by rarity with estimated prices, and a stat-driven Pokémon Showdown.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${mono.variable} ${pixel.variable}`}>
      {/* No body background: the html element paints ink, so the fixed mesh canvas (z -10) shows through. */}
      <body className="min-h-screen text-cream antialiased">
        <MeshBackground />
        <SmoothScroll>
          <SiteNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
