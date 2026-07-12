'use client';

import { useEffect, useRef } from 'react';

// Chargement unique du script Google Maps (Places)
let loaderPromise: Promise<void> | null = null;
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Échec du chargement de Google Maps'));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

interface Props {
  onSelect: (r: { latitude: number; longitude: number; address: string }) => void;
}

export function AddressAutocomplete({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!key || !inputRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ac: any;
    loadGoogleMaps(key)
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google;
        if (!g?.maps?.places || !inputRef.current) return;
        ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ['geometry', 'formatted_address', 'name'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) return;
          onSelectRef.current({
            latitude: Number(loc.lat().toFixed(6)),
            longitude: Number(loc.lng().toFixed(6)),
            address: place.formatted_address || place.name || '',
          });
        });
      })
      .catch(() => {});
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (ac && g?.maps?.event) g.maps.event.clearInstanceListeners(ac);
    };
  }, [key]);

  if (!key) return null;

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Rechercher l'adresse du magasin…"
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
    />
  );
}
