'use client';

import Link from 'next/link';
import { Crown, Loader2 } from 'lucide-react';
import { usePlan } from '@/src/hooks/usePlan';
import { useClient } from '@/src/hooks/useClient';

/** Affiche les enfants si le commerçant a l'accès Pro/essai, sinon un écran d'upgrade. */
export function ProGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { hasAccess } = usePlan();
  const { clientChecked } = useClient();

  if (!clientChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#00704A' }} />
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}>
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#CBA25820' }}>
          <Crown size={26} style={{ color: '#CBA258' }} />
        </div>
        <h1 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          {feature} — plan Pro
        </h1>
        <p className="text-mist text-sm mb-6">
          Cette fonctionnalité est réservée aux abonnés Pro. Passez au Pro pour y accéder.
        </p>
        <Link
          href="/abonnement"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: '#00704A' }}
        >
          <Crown size={16} />
          Voir les plans
        </Link>
      </div>
    </div>
  );
}
