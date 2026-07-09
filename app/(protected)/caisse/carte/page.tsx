'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import { LoyaltyCard } from '@/src/components/LoyaltyCard';

export default function CaisseCarte() {
  const { user } = useAuth();
  const { client } = useClient();
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = `${origin}/join/${user?.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Lien copié!');
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: '#00704A' }} />
      </div>
    );
  }

  return (
    <main className="px-4 pt-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            <QrCode size={24} style={{ color: '#00704A' }} />
            Ma carte
          </h1>
          <p className="text-mist text-sm mt-1">Faites scanner ce QR à un nouveau client pour l&apos;inscrire.</p>
        </div>

        {/* Aperçu de la carte */}
        <div className="bg-white rounded-xl p-5 shadow-sm flex justify-center mb-4">
          <LoyaltyCard client={client} punches={2} />
        </div>

        {/* QR d'inscription */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="p-4 border border-gray-100 rounded-xl">
              <QRCodeSVG value={joinUrl} size={200} fgColor="#1E3932" />
            </div>
          </div>
          <p className="text-mist text-sm text-center mb-4">
            Le client scanne ce code pour obtenir sa carte de fidélité.
          </p>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: '#00704A' }}
          >
            <Copy size={15} />
            Copier le lien d&apos;inscription
          </button>
        </div>
      </div>
    </main>
  );
}
