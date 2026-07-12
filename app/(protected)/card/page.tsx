'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClient } from '@/src/hooks/useClient';
import { useAuth } from '@/src/hooks/useAuth';
import { Sidebar } from '@/src/components/Sidebar';
import { LoyaltyCard } from '@/src/components/LoyaltyCard';


export default function Card() {
  const { user } = useAuth();
  const { client, updateClient } = useClient();
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [origin, setOrigin] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = `${origin}/join/${user?.id}`;

  const [form, setForm] = useState({
    card_name: '',
    organization_name: '',
    total_stamps: 5,
    reward_description: '',
  });

  useEffect(() => {
    if (client && !initialized) {
      setForm({
        card_name: client.card_name || '',
        organization_name: client.organization_name || '',
        total_stamps: client.total_stamps || 5,
        reward_description: client.reward_description || '',
      });
      setInitialized(true);
    }
  }, [client, initialized]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    try {
      await updateClient.mutateAsync({
        card_name: form.card_name,
        organization_name: form.organization_name,
        total_stamps: Number(form.total_stamps),
        reward_description: form.reward_description,
      });
      // Crée ou met à jour la LoyaltyClass Google Wallet
      try {
        if (!client.google_wallet_class_id) {
          await fetch('/api/google-wallet/create-class', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: client.id }),
          });
        } else {
          await fetch('/api/google-wallet/update-class', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              programName: form.card_name,
              issuerName: form.organization_name,
            }),
          });
        }
        // Réapplique le total de tampons requis sur toutes les cartes membres
        await fetch('/api/google-wallet/refresh-objects', { method: 'POST' });
      } catch {
        // non-blocking
      }
      toast.success('Carte mise à jour avec succès.');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Lien copié!');
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = 'qr-inscription.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!client) return null;

  const previewClient = {
    ...client,
    card_name: form.card_name || client.card_name,
    organization_name: form.organization_name || client.organization_name || '',
    total_stamps: Number(form.total_stamps) || client.total_stamps,
    reward_description: form.reward_description || client.reward_description,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
        <h1 className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
          Ma carte
        </h1>
        <p className="text-mist mb-8">Personnalisez votre carte de fidélité.</p>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left — Card preview + form */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm flex justify-center">
              <LoyaltyCard client={previewClient} punches={2} />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold mb-4">Détails de la carte</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Nom de la carte</label>
                  <input
                    type="text"
                    value={form.card_name}
                    onChange={e => setForm(f => ({ ...f, card_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">{"Nom de l'organisation"}</label>
                  <input
                    type="text"
                    value={form.organization_name}
                    onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Nombre de tampons requis</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.total_stamps}
                    onChange={e => setForm(f => ({ ...f, total_stamps: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Récompense</label>
                  <input
                    type="text"
                    value={form.reward_description}
                    onChange={e => setForm(f => ({ ...f, reward_description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">{"URL d'inscription"}</label>
                  <input
                    type="text"
                    readOnly
                    value={joinUrl}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-cream text-mist"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#00704A' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer
                </button>
              </form>
            </div>
          </div>

          {/* Right — QR share */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold mb-4">Partagez votre carte</h2>
              <div ref={qrRef} className="flex justify-center mb-4">
                <div className="p-4 border border-gray-100 rounded-xl">
                  <QRCodeSVG value={joinUrl} size={180} fgColor="#1E3932" />
                </div>
              </div>
              <p className="text-mist text-sm text-center mb-5">
                Vos clients scannent ce QR pour obtenir leur carte Apple/Google Wallet.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink mb-1.5">Lien d'inscription</label>
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-cream text-mist"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#00704A' }}
                >
                  <Copy size={14} />
                  Copier le lien
                </button>
                <button
                  onClick={downloadQR}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-ink text-sm font-medium border border-gray-200 hover:bg-cream transition-all"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
