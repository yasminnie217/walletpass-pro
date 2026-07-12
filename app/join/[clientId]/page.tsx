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

      if (!res.ok) throw new Error(data.error);

      setSaveUrl(data.saveUrl ?? null);
      setSuccess(true);

      // Les notifications passent par Google Wallet (message sur la carte),
      // aucun abonnement navigateur à demander au membre.

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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-full text-white font-medium text-sm transition-all hover:opacity-90"
                  style={{ background: '#000000' }}
                >
                  {/* Logo Google multicolore */}
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Enregistrer dans Google Wallet
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
