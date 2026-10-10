import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-display text-7xl md:text-9xl">
          A wild <span className="text-gold-gradient emph">MissingNo.</span>
        </h1>
        <p className="mt-6 text-muted">This page fled. It isn’t in the vault.</p>
        <Link href="/" className="btn-gold mt-10">Return home</Link>
      </div>
    </main>
  );
}
