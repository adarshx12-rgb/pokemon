import { GrailSequence } from '@/components/grail/GrailSequence';
import { TIER_ORDER } from '@/data/rarity';
import { GRAIL, SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';
import { formatPrice } from '@/lib/tcg/normalize';
import { FieldGuide } from '@/components/home/FieldGuide';
import { Faq } from '@/components/home/Faq';
import { HOME_DESCRIPTION, jsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 86400;

const ORGANIZATION_ID = new URL('/#organization', SITE_URL).href;

async function grailPrice() {
  try {
    return (await getCard(GRAIL.id))?.price ?? null;
  } catch {
    return null; // the home page still renders; the price block and caption fall back
  }
}

export default async function Home() {
  const price = await grailPrice();
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
        '@graph': [
          {
            '@type': 'WebSite',
            name: SITE_NAME,
            alternateName: 'POKÉFAME',
            url: SITE_URL.href,
            description: HOME_DESCRIPTION,
            inLanguage: 'en',
            publisher: { '@id': ORGANIZATION_ID },
          },
          {
            '@type': 'Organization',
            '@id': ORGANIZATION_ID,
            name: SITE_NAME,
            url: SITE_URL.href,
            logo: new URL('/apple-icon.png', SITE_URL).href,
          },
        ],
      })} />
      <GrailSequence
        price={price ? formatPrice(price) : null}
        priceSource={price?.source ?? null}
        updatedAt={price?.updatedAt ?? null}
        tierCount={TIER_ORDER.length}
        cardCount={SHOWCASE.length}
      />
      <FieldGuide />
      <Faq />
    </main>
  );
}
