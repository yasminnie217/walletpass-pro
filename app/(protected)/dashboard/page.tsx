'use client';

import { useRouter } from 'next/navigation';
import { Users, Stamp, CreditCard, Gift, LogOut, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import { useMembers } from '@/src/hooks/useMembers';
import { usePunches } from '@/src/hooks/usePunches';
import { Sidebar } from '@/src/components/Sidebar';
import { StatCard } from '@/src/components/StatCard';
import { getInitials, timeAgo } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { client } = useClient();
  const { members } = useMembers();
  const { punches, todayCount, weeklyData } = usePunches();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const rewardsReady = members.filter(m => m.reward_available).length;

  const firstName = client?.business_name?.split(' ')[0] || user?.email?.split('@')[0] || 'là';
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'WP';

  const recentPunches = punches.slice(0, 10);

  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const res = await fetch(`/api/stats/export?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      a.download = `stats-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de l'export.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ background: '#00704A' }}
            >
              F
            </div>
            <span className="font-semibold text-ink text-sm" style={{ fontFamily: '"Playfair Display", serif' }}>
              Fidely
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{client?.business_name || 'Mon Commerce'}</p>
              <p className="text-xs text-mist">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: '#00704A' }}
            >
              {client?.logo_url
                ? <img src={client.logo_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-mist hover:text-error hover:bg-error/10 transition-all"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1
                className="text-3xl font-bold text-ink"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Bienvenue, {firstName}
              </h1>
              <p className="text-mist mt-1">{"Voici ce qui se passe aujourd'hui."}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                <Download size={15} />
                {exporting === 'xlsx' ? 'Export…' : 'Excel'}
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-ink border border-gray-200 bg-white transition-all hover:bg-cream disabled:opacity-60"
              >
                <Download size={15} />
                {exporting === 'csv' ? 'Export…' : 'CSV'}
              </button>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#CBA25820', color: '#CBA258', border: '1px solid #CBA258' }}
              >
                Plan Pro
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total membres" value={totalMembers} icon={Users} />
            <StatCard title="Tampons aujourd'hui" value={todayCount} icon={Stamp} color="#CBA258" />
            <StatCard title="Cartes actives" value={activeMembers} icon={CreditCard} />
            <StatCard title="Récompenses prêtes" value={rewardsReady} icon={Gift} color="#CBA258" />
          </div>

          {/* Chart + Feed */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Chart */}
            <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold mb-4">Engagement hebdomadaire</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val) => [`${val} tampons`, '']}
                  />
                  <Bar dataKey="tampons" fill="#CBA258" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold mb-4">Activité récente</h2>
              {recentPunches.length === 0 ? (
                <p className="text-mist text-sm text-center py-8">Aucune activité récente.</p>
              ) : (
                <div className="space-y-3">
                  {recentPunches.map(punch => {
                    const m = punch.members;
                    const name = m ? `${m.first_name} ${m.last_name}` : 'Membre';
                    const init = m ? getInitials(m.first_name, m.last_name) : '?';
                    return (
                      <div key={punch.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: '#1E3932' }}
                        >
                          {init}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-ink text-sm font-medium truncate">{name}</p>
                          <p className="text-mist text-xs">A reçu un tampon · {timeAgo(punch.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
