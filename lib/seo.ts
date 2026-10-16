import type { Metadata } from 'next';

export const SITE_NAME = 'Pokéfame';
export const SITE_URL = new URL('https://pokefame.com');
export const HOME_TITLE = 'Pokemon Cards, Rare Cards & Showdown';
export const HOME_DESCRIPTION = 'Explore Pokémon cards and rare Pokémon cards with collector notes and dated price estimates. Build teams and play a Pokémon showdown on Pokéfame.';

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

/** Props for an inline JSON-LD <script>; `<` is escaped so card or page text can't close the tag. */
export function jsonLd(data: Record<string, unknown>) {
  return { __html: JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\u003c') };
}

/** Breadcrumb trail for search results, e.g. Home › The Vault › Charizard ex. */
export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: new URL(item.path, SITE_URL).href })),
  };
}
