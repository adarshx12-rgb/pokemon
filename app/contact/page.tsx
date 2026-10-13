import Link from 'next/link';
import { InfoPage } from '@/components/info/InfoPage';
import { pageMetadata } from '@/lib/seo';
import { SITE_CONTACT } from '@/lib/site-contact';

export const metadata = pageMetadata({ title: 'Contact Us', description: 'Contact pokefame about card corrections, website problems, privacy questions, or artwork rights. Find what to include with your request.', path: '/contact' });

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="A card detail to correct, a battle that went wrong, or a question about the site? Here’s where to start.">
      <section>
        <h2>Get in touch</h2>
        {SITE_CONTACT.placeholder && <p><strong>Contact details are placeholders.</strong> The sample address below is not monitored and cannot receive support requests. Verified contact details will be added here.</p>}
        <p>Email: {SITE_CONTACT.placeholder
          ? <span>{SITE_CONTACT.email}</span>
          : <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>}</p>
        <p>Website operator: {SITE_CONTACT.operator}{SITE_CONTACT.placeholder ? ' (placeholder)' : ''}<br />Country: {SITE_CONTACT.country}</p>
      </section>
      <section>
        <h2>Card corrections</h2>
        <p>Include the card’s page address, set and collector number, the detail you believe is incorrect, and a link to a reliable source. For a price question, include the displayed source, currency, finish, and update date.</p>
        <p>pokefame cannot value, authenticate, buy, or sell an individual card. The <Link href="/#faq">card FAQ</Link> explains how to begin comparing rarity and market information.</p>
      </section>
      <section>
        <h2>Website and battle problems</h2>
        <p>Describe what you were trying to do, the page address, your browser and device, and the steps that led to the problem. For a battle issue, include the Pokémon and moves involved. Remove personal information from any screenshot before sharing it.</p>
      </section>
      <section>
        <h2>Privacy and artwork rights</h2>
        <p>For privacy requests, describe the information or message you want us to review. For a rights concern, identify the affected page and material, explain your connection to the rights holder, and provide a way to reply. Do not send passwords, payment details, or identity documents.</p>
        <p>Read our <Link href="/privacy-policy">Privacy Policy</Link> and <Link href="/terms-and-conditions">Terms &amp; Conditions</Link> for more information.</p>
      </section>
    </InfoPage>
  );
}
