import { InkDefs } from '@/components/manga/InkDefs';

// The Vault pages still use manga InkPanels (restyled in a later pass); they need the #ink-rough filter.
export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InkDefs />
      {children}
    </>
  );
}
