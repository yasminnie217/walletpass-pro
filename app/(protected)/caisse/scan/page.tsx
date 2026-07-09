'use client';

import { ScanLine } from 'lucide-react';
import { ScannerCore } from '@/src/components/ScannerCore';

export default function CaisseScan() {
  return (
    <main className="px-4 pt-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            <ScanLine size={24} style={{ color: '#00704A' }} />
            Scanner
          </h1>
          <p className="text-mist text-sm mt-1">{"Scannez la carte d'un membre pour ajouter un tampon."}</p>
        </div>
        <ScannerCore />
      </div>
    </main>
  );
}
