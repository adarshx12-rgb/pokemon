import Link from 'next/link';
import { InfoPage } from '@/components/info/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { SITE_CONTACT } from '@/lib/site-contact';

export const metadata = pageMetadata({ title: 'Privacy Policy', description: 'How hipokémon handles browser-saved collections, technical requests, external services, and messages, plus your choices about stored information.', path: '/privacy-policy' });

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy policy" intro="What happens to information when you browse the vault, build a team, or get in touch." updated>
      <section>
        <h2>Who this notice covers</h2>
        <p>This notice covers hipokémon at hipokemon.com, including its card reference pages and browser battle tool. For questions about this notice or a privacy request, use our <Link href="/contact">Contact Us page</Link>.</p>
        <p>Operator: {SITE_CONTACT.operator}. Contact email: {SITE_CONTACT.email}. Country: {SITE_CONTACT.country}.{SITE_CONTACT.placeholder && ' These are placeholder details, not a working contact channel. They will be replaced with verified operator information.'}</p>
      </section>
      <section>
        <h2>Your collection stays in your browser</h2>
        <p>When you mark a card as owned or wanted, the site stores its identifier and those choices in local storage on your device. The collection feature does not send those marks to an account or collection database. They remain until you change them or clear this site’s browser storage.</p>
        <p>Teams and battles are held in the current page’s memory. The site requests Pokémon data as you select team members, but it does not provide a saved battle profile. Browsing and playing do not require registration or payment information.</p>
      </section>
      <section>
        <h2>Technical information and external services</h2>
        <p>Loading a website involves sending technical information such as an IP address, requested address, and browser details to the servers involved. Hosting and delivery providers may process request and error logs to deliver pages, prevent abuse, and diagnose faults.</p>
        <p>Card information is obtained from the Pokémon TCG API, and Pokémon data comes from PokéAPI. Some images and sprites load from external services, including Pokémon TCG image servers and GitHub-hosted PokéAPI assets. Direct requests to these services can disclose your IP address and request details to their operators. Their own privacy policies govern their processing.</p>
        <p>The site currently has no account system, advertising trackers, or analytics cookies. The collection controls use local storage rather than a cookie. External sites you choose to visit may use their own cookies and tracking.</p>
      </section>
      <section>
        <h2>When you contact us</h2>
        <p>If you send a message, we receive the contact details and information you choose to include. We use them to handle your question, investigate a reported problem, or respond to a privacy or rights request. Please avoid sending payment details, identity documents, passwords, or other information that is unnecessary for the request.</p>
        <p>Messages may be processed by the email service used to receive them. We keep correspondence only as needed to handle the request, resolve related issues, or meet applicable legal obligations. Technical-log retention is controlled by the relevant hosting or delivery service.</p>
      </section>
      <section>
        <h2>Your choices and requests</h2>
        <p>You can remove collection and wishlist marks using the card controls, or clear hipokemon.com’s site data in your browser settings. Clearing storage affects that browser; there is no account backup to restore it from.</p>
        <p>Depending on the laws that apply to you, you may have rights to access, correct, delete, or restrict the use of personal information, or to complain to a data-protection authority. <Link href="/contact">Contact us</Link> to make a request about information you have sent us. We may need enough information to verify and locate the request without collecting unnecessary identification.</p>
      </section>
      <section>
        <h2>Children and changes to this notice</h2>
        <p>The site does not ask children to create accounts or submit personal profiles. A parent or guardian who believes a child has sent personal information can contact us to request its review or deletion.</p>
        <p>If the site adds features that change how information is handled, this notice will be updated. The date above identifies the current version.</p>
      </section>
    </InfoPage>
  );
}
