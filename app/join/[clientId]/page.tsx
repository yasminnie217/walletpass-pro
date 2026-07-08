'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { LoyaltyCard } from '@/src/components/LoyaltyCard';
import type { Client } from '@/src/types';

export default function Join() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [emailConsent, setEmailConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setClient(data as Client);
        setLoadingClient(false);
      });
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.first_name || !form.last_name || !form.email) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!clientId || !client) {
      setError('Une erreur est survenue. Réessayez.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          email_consent: emailConsent,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setError('Ce courriel est déjà inscrit.');
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(data.error);

      setSaveUrl(data.saveUrl ?? null);
      setSuccess(true);

      // Demande la permission de notifications push et enregistre l'abonnement
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          const permission = await Notification.requestPermission();
          if (permission === 'granted' && data.member?.id) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
            await fetch('/api/web-push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memberId: data.member.id, subscription: sub.toJSON() }),
            });
          }
        } catch {
          // non-bloquant
        }
      }

      if (data.saveUrl) {
        setTimeout(() => {
          window.location.href = data.saveUrl;
        }, 1500);
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
        <Loader2 className="animate-spin text-matcha" size={32} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}>
        <div className="text-center">
          <p className="text-ink font-semibold">Commerce introuvable.</p>
          <p className="text-mist text-sm mt-1">Vérifiez le lien et réessayez.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}
    >
      <div className="max-w-sm mx-auto">
        {/* App logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#00704A' }}
          >
            W
          </div>
          <span className="font-semibold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
            WalletPass Pro
          </span>
        </div>

        {/* Card preview */}
        <div className="flex justify-center mb-6">
          <LoyaltyCard client={client} punches={0} />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Rejoignez {client.business_name}
          </h1>
          <p className="text-mist mt-1">Obtenez votre carte de fidélité gratuite</p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#00704A' }} />
            <h2 className="text-ink font-semibold text-lg">Bienvenue!</h2>
            {saveUrl ? (
              <>
                <p className="text-mist text-sm mt-1 mb-4">Votre carte est prête. Ajoutez-la à Google Wallet.</p>
                <a
                  href={saveUrl}
                  className="inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* Bouton officiel Google Wallet */}
                  <img
                    src="https://wallet.google/static/media/save-to-google-wallet-button.svg"
                    alt="Enregistrer dans Google Wallet"
                    style={{ height: '48px' }}
                  />
                </a>
              </>
            ) : (
              <p className="text-mist text-sm mt-1">Votre carte a été créée avec succès.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Prénom *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="Marie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nom de famille *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="Tremblay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="marie@exemple.com"
                />
              </div>

              {/* Consentement courriel — LCAP/CASL, non pré-coché */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailConsent}
                  onChange={e => setEmailConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-matcha flex-shrink-0"
                />
                <span className="text-xs text-mist leading-relaxed">
                  J&apos;accepte de recevoir des offres promotionnelles et des nouvelles de{' '}
                  <strong className="text-ink">{client.business_name}</strong> par courriel.
                  Je peux me désabonner en tout temps.
                </span>
              </label>

              {error && (
                <p className="text-error text-sm font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création de votre carte en cours…
                  </>
                ) : (
                  'Obtenir ma carte gratuite 🎁'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
