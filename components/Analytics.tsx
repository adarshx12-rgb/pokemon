'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useSyncExternalStore } from 'react';

const GA_ID = 'G-7BY96E0KMR';
const PRODUCTION_HOST = 'pokefame.com';

const subscribe = () => () => {};

/** Loads Google Analytics only on the live site, so local runs and test builds never reach the reports. */
export function Analytics() {
  const isProduction = useSyncExternalStore(subscribe, () => window.location.hostname === PRODUCTION_HOST, () => false);
  return isProduction ? <GoogleAnalytics gaId={GA_ID} /> : null;
}
