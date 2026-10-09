import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Press_Start_2P } from 'next/font/google';
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
      <body className="min-h-screen bg-ink text-cream antialiased">{children}</body>
    </html>
  );
}
