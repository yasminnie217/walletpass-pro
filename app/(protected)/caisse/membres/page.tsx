'use client';

import { useState } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMembers } from '@/src/hooks/useMembers';
import { usePunches } from '@/src/hooks/usePunches';
import { useClient } from '@/src/hooks/useClient';
import { CashierMemberItem } from '@/src/components/CashierMemberItem';
import { recordRedemption } from '@/src/lib/redemptions';
import type { Member } from '@/src/types';

export default function CaisseMembres() {
  const { members, isLoading, updateMember } = useMembers();
  const { addPunch } = usePunches();
  const { client } = useClient();
  const [search, setSearch] = useState('');
  const [punchingId, setPunchingId] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const totalStamps = client?.total_stamps || 5;

  const filtered = members.filter(m =>
    `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handlePunch = async (member: Member) => {
    setPunchingId(member.id);
    try {
      const newPunches = (member.punches || 0) + 1;
      const rewardReady = newPunches >= totalStamps;

      await addPunch.mutateAsync({ memberId: member.id });
      await updateMember.mutateAsync({
        id: member.id,
        updates: { punches: newPunches, reward_available: rewardReady },
      });

      if (member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id, newPoints: newPunches }),
          });
        } catch { /* non-blocking */ }
      }

      if (rewardReady) {
        toast.success(`🎉 Récompense disponible pour ${member.first_name}!`);
      } else {
        toast.success(`Tampon ajouté. ${newPunches}/${totalStamps} tampons.`);
      }
    } catch {
      toast.error("Erreur lors de l'ajout du tampon.");
    } finally {
      setPunchingId(null);
    }
  };

  const handleRedeem = async (member: Member) => {
    setRedeemingId(member.id);
    try {
      const remaining = Math.max(0, (member.punches || 0) - totalStamps);
      const stillReward = remaining >= totalStamps;

      await updateMember.mutateAsync({
        id: member.id,
        updates: { punches: remaining, reward_available: stillReward },
      });

      await recordRedemption(member.id, member.client_id, client?.reward_description);

      if (member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id, newPoints: remaining }),
          });
        } catch { /* non-blocking */ }
      }

      toast.success(`Récompense utilisée pour ${member.first_name}. Solde : ${remaining}/${totalStamps}.`);
    } catch {
      toast.error('Erreur lors de la réinitialisation.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <main className="px-4 pt-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            <Users size={24} style={{ color: '#00704A' }} />
            Membres
          </h1>
          <p className="text-mist text-sm mt-1">{members.length} membre{members.length !== 1 ? 's' : ''} fidèle{members.length !== 1 ? 's' : ''}.</p>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou courriel…"
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin" size={28} style={{ color: '#00704A' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-mist/40 mb-3" />
            <p className="text-ink font-medium">Aucun membre trouvé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(member => (
              <CashierMemberItem
                key={member.id}
                member={member}
                totalStamps={totalStamps}
                onPunch={handlePunch}
                isPunching={punchingId === member.id}
                onRedeem={handleRedeem}
                isRedeeming={redeemingId === member.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
