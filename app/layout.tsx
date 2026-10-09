import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Press_Start_2P } from 'next/font/google';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Cursor } from '@/components/motion/Cursor';
import { MarbleBackground } from '@/components/motion/MarbleBackground';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  title: 'Pokémon Vault',
  description: 'Rare Pokémon cards ranked by rarity with estimated prices, and a stat-driven Pokémon Showdown.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${pixel.variable}`}>
      {/* No body background: the html element paints ink, so the fixed marble layer (z -10) shows through. */}
      <body className="min-h-screen text-cream antialiased">
        <MarbleBackground />
        <SmoothScroll>
          <Cursor />
          <SiteNav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
