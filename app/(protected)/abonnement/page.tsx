'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '@/src/components/Sidebar';
import { useAuth } from '@/src/hooks/useAuth';
import { usePlan } from '@/src/hooks/usePlan';
import { PRO_PRICE, TRIAL_DAYS } from '@/src/lib/plan';

const FEATURES = [
  'Cartes de fidélité dans Google Wallet',
  'Scanner et tampons en temps réel',
  'Membres illimités',
  'Notifications aux membres',
  'Notifications de proximité',
  'App caissier dédiée',
  'Exports Excel et CSV',
  'Historique des tampons et récompenses',
];

export default function Abonnement() {
  const { user } = useAuth();
  const { isPro, isTrialing, trialDaysLeft } = usePlan();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['client', user?.id] });

  const activate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/activate', { method: 'POST' });
      if (!res.ok) throw new Error();
      await refresh();
      toast.success('Abonnement activé ! (démo)');
    } catch {
      toast.error("Erreur lors de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      if (!res.ok) throw new Error();
      await refresh();
      toast.success('Abonnement annulé (démo).');
    } catch {
      toast.error('Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = isPro
    ? 'Abonnement actif'
    : isTrialing
      ? `Essai gratuit — ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}`
      : 'Essai terminé — abonnement requis';

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8" style={{ background: '#F9F6F0' }}>
        <div className="max-w-lg mx-auto md:mx-0">
          <h1 className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
            Abonnement
          </h1>
          <p className="text-mist mb-6">Gérez votre abonnement Fidely.</p>

          {/* Statut */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isPro ? '#CBA25820' : '#00704A15' }}>
              <Crown size={20} style={{ color: isPro ? '#CBA258' : '#00704A' }} />
            </div>
            <div className="flex-1">
              <p className="text-ink font-semibold">{statusLabel}</p>
              {!isPro && !isTrialing && (
                <p className="text-mist text-sm">Abonnez-vous pour réactiver votre programme.</p>
              )}
            </div>
          </div>

          {/* Offre */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: '#CBA25820', color: '#CBA258', border: '1px solid #CBA258' }}>
                Fidely Pro
              </span>
              <p className="text-3xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>{PRO_PRICE}</p>
              <p className="text-mist text-sm mt-1">
                {TRIAL_DAYS} jours d&apos;essai gratuit, puis {PRO_PRICE} · annulable en tout temps
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink">
                  <Check size={16} style={{ color: '#00704A' }} className="flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {!isPro ? (
              <>
                <button
                  onClick={activate}
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#00704A' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Crown size={18} />}
                  {isTrialing ? "S'abonner maintenant" : 'Réactiver mon abonnement'}
                </button>
                <p className="text-mist/60 text-xs mt-3 text-center">Activation de démonstration — le paiement réel sera branché prochainement.</p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-ink font-medium mb-4">Merci ! Votre abonnement est actif. 🎉</p>
                <button
                  onClick={cancel}
                  disabled={loading}
                  className="text-sm font-medium text-mist hover:text-error transition-colors disabled:opacity-60"
                >
                  {loading ? 'Traitement…' : 'Annuler l\'abonnement (démo)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
