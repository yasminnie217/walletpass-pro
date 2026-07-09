'use client';

import { ScanLine } from 'lucide-react';
import { Sidebar } from '@/src/components/Sidebar';
import { ScannerCore } from '@/src/components/ScannerCore';

export default function Scanner() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: '"Playfair Display", serif' }}>
              <ScanLine size={28} style={{ color: '#00704A' }} />
              Scanner
            </h1>
            <p className="text-mist mt-1">{"Scannez la carte d'un membre pour ajouter un tampon."}</p>
          </div>
          <ScannerCore />
        </div>
      </main>
    </div>
  );
}
