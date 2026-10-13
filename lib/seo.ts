import type { Metadata } from 'next';

export const SITE_NAME = 'pokéfame';
export const SITE_URL = new URL('https://pokefame.com');
export const HOME_TITLE = 'Pokemon Cards, Rare Cards & Showdown';
export const HOME_DESCRIPTION = 'Explore Pokémon cards and rare Pokémon cards with collector notes and dated price estimates. Build teams and play a Pokémon showdown on pokéfame.';

export function pageMetadata({ title, description, path, image }: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt: string };
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const preview = image ?? {
    url: '/social-image',
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: 'POKÉFAME — Pokémon cards, rare finds, and a Pokémon battle simulator',
  };
  return {
    title: fullTitle,
    description,
    alternates: { canonical: new URL(path, SITE_URL).href },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: new URL(path, SITE_URL).href,
      images: [preview],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [preview],
    },
  };
}
