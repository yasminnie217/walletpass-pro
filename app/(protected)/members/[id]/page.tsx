'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Stamp, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import { Sidebar } from '@/src/components/Sidebar';
import { recordRedemption } from '@/src/lib/redemptions';
import { timeAgo, formatDate, getInitials } from '@/src/lib/utils';
import type { Member, Punch, Redemption } from '@/src/types';

export default function MemberDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { client } = useClient();
  const memberId = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [punches, setPunches] = useState<Punch[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const totalStamps = client?.total_stamps || 5;

  useEffect(() => {
    if (!user || !memberId) return;
    const load = async () => {
      const [{ data: m }, { data: p }, { data: r }] = await Promise.all([
        supabase.from('members').select('*').eq('id', memberId).eq('client_id', user.id).single(),
        supabase.from('punches').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
        supabase.from('redemptions').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      ]);
      if (m) setMember(m as Member);
      if (p) setPunches(p as Punch[]);
      if (r) setRedemptions(r as Redemption[]);
      setLoading(false);
    };
    load();
  }, [user, memberId]);

  const handleRedeem = async () => {
    if (!member) return;
    setRedeeming(true);
    try {
      const remaining = Math.max(0, member.punches - totalStamps);
      const stillReward = remaining >= totalStamps;

      await supabase.from('members').update({ punches: remaining, reward_available: stillReward }).eq('id', member.id);

      await recordRedemption(member.id, member.client_id, client?.reward_description);
      setRedemptions(list => [
        { id: `tmp_${Date.now()}`, member_id: member.id, client_id: member.client_id, reward_description: client?.reward_description ?? null, created_at: new Date().toISOString() },
        ...list,
      ]);

      if (member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id, newPoints: remaining }),
          });
        } catch { /* non-blocking */ }
      }

      setMember(m => m ? { ...m, punches: remaining, reward_available: stillReward } : m);
      toast.success(`Récompense utilisée. Solde : ${remaining}/${totalStamps}.`);
    } catch {
      toast.error('Erreur lors de la réinitialisation.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center" style={{ background: '#F9F6F0' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#00704A' }} />
        </main>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center" style={{ background: '#F9F6F0' }}>
          <div className="text-center">
            <p className="text-ink font-semibold">Membre introuvable.</p>
            <button onClick={() => router.push('/members')} className="text-matcha text-sm mt-2 hover:underline">
              ← Retour aux membres
            </button>
          </div>
        </main>
      </div>
    );
  }

  const progress = Math.min((member.punches / totalStamps) * 100, 100);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
        {/* Back */}
        <button
          onClick={() => router.push('/members')}
          className="flex items-center gap-2 text-mist hover:text-ink text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux membres
        </button>

        <div className="max-w-2xl space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: '#1E3932' }}
              >
                {getInitials(member.first_name, member.last_name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {member.first_name} {member.last_name}
                </h1>
                <p className="text-mist text-sm">{member.email}</p>
              </div>
              {member.reward_available && (
                <span
                  className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#CBA25820', color: '#CBA258', border: '1px solid #CBA258' }}
                >
                  Récompense prête
                </span>
              )}
            </div>

            {/* Progression */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-mist">Progression de la carte</span>
                <span className="font-semibold text-ink" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {member.punches}/{totalStamps}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: '#CBA258' }}
                />
              </div>
            </div>

            {/* Stamps visual */}
            <div className="flex flex-wrap gap-2 mb-5">
              {Array.from({ length: totalStamps }).map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: i < member.punches ? '#00704A' : '#F3F4F6',
                  }}
                >
                  <Stamp size={14} style={{ color: i < member.punches ? 'white' : '#D1D5DB' }} />
                </div>
              ))}
            </div>

            <div className="flex gap-3 text-sm text-mist border-t border-gray-100 pt-4">
              <span>Membre depuis le {formatDate(member.joined_at)}</span>
              {member.pass_id && (
                <>
                  <span>·</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}>
                    Pass ID: {member.pass_id}
                  </span>
                </>
              )}
            </div>

            {member.reward_available && (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#CBA258' }}
              >
                {redeeming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
                Marquer la récompense comme utilisée
              </button>
            )}
          </div>

          {/* Punch history */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-ink font-semibold">Historique des tampons</h2>
              <span className="text-mist text-sm">{punches.length} tampon{punches.length !== 1 ? 's' : ''} au total</span>
            </div>
            {punches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Stamp size={32} className="text-mist/30 mb-3" />
                <p className="text-mist text-sm">Aucun tampon pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {punches.map((punch, i) => (
                  <div key={punch.id} className="flex items-center gap-4 px-6 py-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#00704A15' }}
                    >
                      <Stamp size={13} style={{ color: '#00704A' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-ink text-sm font-medium">Tampon #{punches.length - i}</p>
                      <p className="text-mist text-xs">{timeAgo(punch.created_at)}</p>
                    </div>
                    <p className="text-mist text-xs">{formatDate(punch.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reward history */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-ink font-semibold">Historique des récompenses</h2>
              <span className="text-mist text-sm">{redemptions.length} utilisée{redemptions.length !== 1 ? 's' : ''}</span>
            </div>
            {redemptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Gift size={32} className="text-mist/30 mb-3" />
                <p className="text-mist text-sm">Aucune récompense utilisée pour l&apos;instant.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#CBA25820' }}
                    >
                      <Gift size={13} style={{ color: '#CBA258' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-ink text-sm font-medium">{r.reward_description || 'Récompense'}</p>
                      <p className="text-mist text-xs">{timeAgo(r.created_at)}</p>
                    </div>
                    <p className="text-mist text-xs">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
