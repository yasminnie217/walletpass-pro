'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!clientChecked) return;
    if (!client) router.replace('/onboarding');
  }, [authLoading, user, clientChecked, client, router]);

  if (authLoading || !user || !clientChecked || !client) return <Spinner />;

  return <>{children}</>;
}
