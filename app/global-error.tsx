'use client';

import { ErrorScreen } from '@/components/errors/ErrorScreen';

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | pokefame</title>
        <meta name="robots" content="noindex" />
      </head>
      <body style={{ margin: 0, background: '#050507' }}>
        <ErrorScreen code="500" retry={retry} />
      </body>
    </html>
  );
}
