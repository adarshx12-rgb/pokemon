import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center text-indigo">
      <div>
        <p className="meta">Error 404</p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] text-red sm:text-8xl md:text-[10rem]">A wild MissingNo.</h1>
        <p className="copy mx-auto mt-6 max-w-sm">This page fled. It isn’t in the vault.</p>
        <Link href="/" className="text-link mt-10">Back to the vault →</Link>
      </div>
    </main>
  );
}
