'use client';

import { useEffect } from 'react';

/** Enregistre le service worker pour l'installabilité PWA de l'app caissier. */
export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // non-bloquant
      });
    }
  }, []);
  return null;
}
