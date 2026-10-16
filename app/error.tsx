'use client';

import { ErrorScreen } from '@/components/errors/ErrorScreen';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>Something went wrong | Pokéfame</title>
      <meta name="robots" content="noindex" />
      <ErrorScreen code="500" retry={retry} />
    </>
  );
}
