'use client';

import { useState } from 'react';
import { UserPlus, Search, Download, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMembers } from '@/src/hooks/useMembers';
import { usePunches } from '@/src/hooks/usePunches';
import { useClient } from '@/src/hooks/useClient';
import { useAuth } from '@/src/hooks/useAuth';
import { Sidebar } from '@/src/components/Sidebar';
import { MemberRow } from '@/src/components/MemberRow';
import { recordRedemption } from '@/src/lib/redemptions';
import { usePlan } from '@/src/hooks/usePlan';
import type { Member } from '@/src/types';

export default function Members() {
  const { user } = useAuth();
  const { members, isLoading, addMember, updateMember } = useMembers();
  const { addPunch } = usePunches();
  const { client } = useClient();
  const [search, setSearch] = useState('');
  const [punchingId, setPunchingId] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ first_name: '', last_name: '', email: '' });
  const [addingMember, setAddingMember] = useState(false);

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

      // Met à jour la carte Google Wallet (non-bloquant)
      if (member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id, newPoints: newPunches }),
          });
        } catch {
          // non-blocking
        }
      }

      if (rewardReady) {
        toast.success(`🎉 Récompense disponible pour ${member.first_name}!`);
      } else {
        toast.success(`Tampon ajouté pour ${member.first_name}. ${newPunches}/${totalStamps} tampons.`);
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.first_name || !newMember.last_name || !newMember.email) {
      toast.error('Tous les champs sont obligatoires.');
      return;
    }
    if (!user) return;
    setAddingMember(true);
    try {
      await addMember.mutateAsync({
        client_id: user.id,
        first_name: newMember.first_name,
        last_name: newMember.last_name,
        email: newMember.email,
        pass_id: null,
        google_wallet_object_id: null,
        punches: 0,
        reward_available: false,
        status: 'active',
        email_consent: false,
        email_consent_at: null,
      });
      toast.success('Membre ajouté.');
      setShowModal(false);
      setNewMember({ first_name: '', last_name: '', email: '' });
    } catch {
      toast.error("Erreur lors de l'ajout du membre.");
    } finally {
      setAddingMember(false);
    }
  };

  const { hasAccess } = usePlan();
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!hasAccess) {
      toast.error('Les exports sont réservés au plan Pro.');
      return;
    }
    setExporting(format);
    try {
      const res = await fetch(`/api/members/export?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      a.download = `membres-${d}.${format}`;
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
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8" style={{ background: '#F9F6F0' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
              Membres
            </h1>
            <p className="text-mist mt-1">{members.length} membre{members.length !== 1 ? 's' : ''} fidèle{members.length !== 1 ? 's' : ''}.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: '#00704A' }}
          >
            <UserPlus size={16} />
            Ajouter un membre
          </button>
        </div>

        {/* Search + Export */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou courriel…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
            />
          </div>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#00704A' }}
          >
            <Download size={14} />
            {exporting === 'xlsx' ? 'Export…' : 'Excel'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-ink hover:bg-cream transition-all disabled:opacity-60"
          >
            <Download size={14} />
            {exporting === 'csv' ? 'Export…' : 'CSV'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-matcha" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-mist/40 mb-3" />
              <p className="text-ink font-medium">Aucun membre pour l&apos;instant.</p>
              <p className="text-mist text-sm mt-1">Partagez votre QR code pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-cream/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Courriel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Tampons</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Inscription</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-mist uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      totalStamps={totalStamps}
                      onPunch={handlePunch}
                      isPunching={punchingId === member.id}
                      onRedeem={handleRedeem}
                      isRedeeming={redeemingId === member.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add member modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-ink font-semibold text-lg mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
              Ajouter un membre
            </h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={newMember.first_name}
                  onChange={e => setNewMember(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nom de famille</label>
                <input
                  type="text"
                  value={newMember.last_name}
                  onChange={e => setNewMember(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-ink hover:bg-cream transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="flex-1 py-2.5 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#00704A' }}
                >
                  {addingMember && <Loader2 size={14} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
