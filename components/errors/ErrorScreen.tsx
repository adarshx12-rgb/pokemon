/* eslint-disable @next/next/no-html-link-for-pages -- Full navigation recovers even when the root layout or client router has failed. */
import styles from './error-screen.module.css';

export function ErrorScreen({ code, retry }: { code: '404' | '500'; retry?: () => void }) {
  const missing = code === '404';
  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <p className={styles.brand}>HIPOKÉMON</p>
        <p className={styles.code} aria-label={`Error ${code}`}>{code}</p>
        <h1>{missing ? 'A wild MissingNo.' : 'Something went wrong.'}</h1>
        <p className={styles.description}>{missing
          ? 'This page isn’t in the Pokédex. The link may have changed, or the card may no longer be here.'
          : 'We couldn’t load this part of the site. Try again, or head back to the collection.'}</p>
        <div className={styles.actions}>
          {retry && <button type="button" onClick={retry}>Try again</button>}
          <a href="/">Back to home</a>
          <a href="/cards">Browse the vault</a>
        </div>
        <p className={styles.help}>Still stuck? <a href="/contact">Contact us</a>.</p>
      </div>
    </main>
  );
}
