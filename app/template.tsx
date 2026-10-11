// Pure CSS (see .page-curtain / .page-in in globals.css), so the page shows without JavaScript and the
// heading paints before hydration. A template remounts on every navigation, which replays both animations.
// The curtain is hidden with CSS under reduced motion, so server and client markup match.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        aria-hidden
        className="page-curtain pointer-events-none fixed inset-0 z-[90] origin-top border-b border-red bg-ink motion-reduce:hidden"
      />
      <div className="page-in">{children}</div>
    </>
  );
}
