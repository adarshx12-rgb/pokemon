import { GrailSequence } from '@/components/grail/GrailSequence';
import { TIER_ORDER } from '@/data/rarity';
import { GRAIL, SHOWCASE } from '@/data/showcase';
import { getCard } from '@/lib/tcg/client';
import { formatPrice } from '@/lib/tcg/normalize';
import { FieldGuide } from '@/components/home/FieldGuide';
import { Faq } from '@/components/home/Faq';
import { HOME_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 86400;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: 'POKEFAME',
        url: SITE_URL.href,
        description: HOME_DESCRIPTION,
        inLanguage: 'en',
      }).replace(/</g, '\\u003c') }} />
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
