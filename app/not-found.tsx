import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/errors/ErrorScreen';

export const metadata: Metadata = {
  title: 'Page not found | hipokémon',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return <ErrorScreen code="404" />;
}
