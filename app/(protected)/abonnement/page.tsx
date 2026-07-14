'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '@/src/components/Sidebar';
import { useAuth } from '@/src/hooks/useAuth';
import { usePlan } from '@/src/hooks/usePlan';
import { PRO_PRICE, TRIAL_DAYS, FREE_MEMBER_CAP } from '@/src/lib/plan';

const FEATURES = [
  { label: 'Carte de fidélité Google Wallet', free: true, pro: true },
  { label: 'Scanner et tampons', free: true, pro: true },
  { label: `Membres`, free: `Jusqu'à ${FREE_MEMBER_CAP}`, pro: 'Illimités' },
  { label: 'Notifications aux membres', free: false, pro: true },
  { label: 'Exports Excel / CSV', free: false, pro: true },
  { label: 'Notifications de proximité', free: false, pro: true },
  { label: 'App caissier dédiée', free: false, pro: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check size={16} style={{ color: '#00704A' }} />;
  if (v === false) return <X size={16} className="text-mist/50" />;
  return <span className="text-xs text-ink font-medium">{v}</span>;
}

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
      toast.success('Abonnement Pro activé ! (démo)');
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
      toast.success('Repassé au plan gratuit (démo).');
    } catch {
      toast.error("Erreur.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = isPro
    ? 'Plan Pro actif'
    : isTrialing
      ? `Essai gratuit — ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}`
      : 'Plan gratuit';

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8" style={{ background: '#F9F6F0' }}>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
            Abonnement
          </h1>
          <p className="text-mist mb-6">Gérez votre plan Fidely.</p>

          {/* Statut */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isPro ? '#CBA25820' : '#00704A15' }}>
              <Crown size={20} style={{ color: isPro ? '#CBA258' : '#00704A' }} />
            </div>
            <div className="flex-1">
              <p className="text-ink font-semibold">{statusLabel}</p>
              {!isPro && (
                <p className="text-mist text-sm">Passez au Pro pour tout débloquer.</p>
              )}
            </div>
          </div>

          {/* Comparatif */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-mist uppercase tracking-wide">
              <span>Fonctionnalité</span>
              <span className="text-center w-16">Gratuit</span>
              <span className="text-center w-16">Pro</span>
            </div>
            {FEATURES.map((f) => (
              <div key={f.label} className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-5 py-3 border-b border-gray-50 items-center">
                <span className="text-ink text-sm">{f.label}</span>
                <span className="flex justify-center w-16"><Cell v={f.free} /></span>
                <span className="flex justify-center w-16"><Cell v={f.pro} /></span>
              </div>
            ))}
          </div>

          {/* Prix + action */}
          {!isPro ? (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>{PRO_PRICE}</p>
              <p className="text-mist text-sm mt-1 mb-5">Essai gratuit de {TRIAL_DAYS} jours · annulable en tout temps</p>
              <button
                onClick={activate}
                disabled={loading}
                className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Crown size={18} />}
                Passer au Pro
              </button>
              <p className="text-mist/60 text-xs mt-3">Activation de démonstration — le paiement réel sera branché prochainement.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-ink font-medium mb-4">Vous profitez de toutes les fonctionnalités Pro. 🎉</p>
              <button
                onClick={cancel}
                disabled={loading}
                className="text-sm font-medium text-mist hover:text-error transition-colors disabled:opacity-60"
              >
                {loading ? 'Traitement…' : 'Revenir au plan gratuit (démo)'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
