'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface Result {
  latitude: number;
  longitude: number;
  address: string;
}

interface Props {
  onSelect: (r: Result) => void;
}

/** Recherche d'adresse gratuite (OpenStreetMap) avec suggestions. */
export function AddressAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(false);

  // Recherche déclenchée après une pause de frappe (debounce)
  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    const q = query.trim();
    if (q.length < 3) { setResults([]); return; }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as Result[];
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  // Fermeture au clic à l'extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (r: Result) => {
    skipNext.current = true;
    setQuery(r.address);
    setResults([]);
    setOpen(false);
    onSelect(r);
  };

  return (
    <div ref={boxRef} className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocusCapture={() => results.length && setOpen(true)}
        placeholder="Rechercher l'adresse du magasin…"
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
      />
      {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-mist" />}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-cream transition-colors"
              >
                {r.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
