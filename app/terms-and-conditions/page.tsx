import Link from 'next/link';
import { InfoPage } from '@/components/info/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { SITE_CONTACT } from '@/lib/site-contact';

export const metadata = pageMetadata({ title: 'Terms & Conditions', description: 'Terms for using hipokémon’s Pokémon card reference and battle tool, including price information, acceptable use, third-party content, and availability.', path: '/terms-and-conditions' });

export default function TermsPage() {
  return (
    <InfoPage title="Terms & conditions" intro="The terms for browsing the collection and using the hipokémon battle tool." updated>
      <section>
        <h2>Using hipokémon</h2>
        <p>These terms apply to hipokemon.com. By using the site, you agree to these terms. If you do not agree, please stop using it. hipokémon provides a free card reference and a simplified browser battle tool for information and entertainment.</p>
        <p>Website operator: {SITE_CONTACT.operator}.{SITE_CONTACT.placeholder && ' This operator name is a placeholder; verified details will be published on the Contact Us page.'}</p>
        <p>We do not sell cards, take payments, authenticate physical copies, or arrange transactions between collectors. The <Link href="/privacy-policy">Privacy Policy</Link> explains how information is handled when you use the site.</p>
      </section>
      <section>
        <h2>Card information and estimates</h2>
        <p>Descriptions, rarity groups, and price estimates can be incomplete, delayed, or incorrect. Our vault tiers are editorial groupings, not official rarity rankings. Prices are dated references for raw, ungraded cards and are not appraisals, investment advice, purchase offers, or promises of future value.</p>
        <p>Before relying on information for a purchase or sale, independently verify the card’s identity, finish, condition, authenticity, and relevant market data. A catalog image does not establish the condition of any copy offered by a seller.</p>
      </section>
      <section>
        <h2>Battle tool and saved choices</h2>
        <p>The battle tool uses simplified mechanics and does not represent every rule of the Pokémon games or the Pokémon Showdown service. Results should not be treated as predictions of a competitive match under a different ruleset.</p>
        <p>Owned and wanted marks are saved in your browser, not in a user account. Browser settings, storage clearing, or changes to your device can remove them. Keep a separate record if you need a durable collection inventory.</p>
      </section>
      <section>
        <h2>Respectful and lawful use</h2>
        <p>Use the site lawfully. Do not attempt to bypass security controls, gain unauthorized access, disrupt the service, submit malicious content, or overload the site or its data providers. Do not misrepresent hipokémon as an official Pokémon service.</p>
        <p>When reporting a problem or supplying a reference, share only information you are entitled to provide. Avoid sending personal information about other people unless it is necessary and you have a lawful reason to do so.</p>
      </section>
      <section>
        <h2>Content, trademarks, and external links</h2>
        <p>Pokémon names, characters, card artwork, and other third-party materials remain the property of their respective rights holders. The presence of a card image or source link does not grant permission to reproduce or commercially exploit it. Any reuse must respect applicable rights and licenses.</p>
        <p>External services operate under their own terms and policies. We do not control their availability, listings, prices, or transactions. hipokémon is an independent fan project and is not affiliated with Nintendo, Creatures, Game Freak, The Pokémon Company, or Pokémon Showdown.</p>
      </section>
      <section>
        <h2>Availability and responsibility</h2>
        <p>The site is provided as available. Features and data sources may change or become unavailable, and we cannot promise uninterrupted access or error-free information. To the extent permitted by applicable law, we disclaim implied warranties about the service and responsibility for losses arising from reliance on its estimates or third-party content.</p>
        <p>Nothing in these terms excludes liability or limits consumer rights where doing so would be unlawful. These terms do not require you to waive rights that applicable law protects.</p>
      </section>
      <section>
        <h2>Changes and questions</h2>
        <p>These terms may be revised as the service changes. The date above identifies this version. For questions, corrections, or intellectual-property concerns, visit <Link href="/contact">Contact Us</Link>.</p>
      </section>
    </InfoPage>
  );
}
