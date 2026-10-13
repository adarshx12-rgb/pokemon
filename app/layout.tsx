import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Anton, JetBrains_Mono, Press_Start_2P } from 'next/font/google';
import { MeshBackground } from '@/components/grail/MeshBackground';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { HOME_DESCRIPTION, HOME_TITLE, pageMetadata, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-press-start' });

export const metadata: Metadata = {
  ...pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: '/' }),
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
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
          <SiteFooter />
        </SmoothScroll>
      </body>
      <GoogleAnalytics gaId="G-YJW3K1WSC5" />
    </html>
  );
}
