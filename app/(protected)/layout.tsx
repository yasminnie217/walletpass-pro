'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import { planStatus } from '@/src/lib/plan';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#00704A' }} />
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { client, clientChecked } = useClient();
  const router = useRouter();
  const pathname = usePathname();

  const hasAccess = planStatus(client).hasAccess;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!clientChecked) return;
    if (!client) { router.replace('/onboarding'); return; }
    // Essai terminé et pas d'abonnement → seule la page Abonnement reste accessible
    if (!hasAccess && pathname !== '/abonnement') {
      router.replace('/abonnement');
    }
  }, [authLoading, user, clientChecked, client, hasAccess, pathname, router]);

  if (authLoading || !user || !clientChecked || !client) return <Spinner />;
  if (!hasAccess && pathname !== '/abonnement') return <Spinner />;

  return <>{children}</>;
}
