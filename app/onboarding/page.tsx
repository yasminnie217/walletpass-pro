'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import { LoyaltyCard } from '@/src/components/LoyaltyCard';
import type { Client } from '@/src/types';

export default function Onboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { client, clientChecked, createClient } = useClient();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: user?.user_metadata?.business_name || '',
    organization_name: '',
    card_name: '',
    total_stamps: 5,
    reward_description: '',
    primary_color: '#00704A',
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', user.id);
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoUrl(data.url);
      toast.success('Logo ajouté !');
    } catch {
      toast.error("Erreur lors de l'upload du logo.");
    } finally {
      setUploading(false);
    }
  };

  // Pre-fill business name from signup metadata
  useEffect(() => {
    if (user?.user_metadata?.business_name) {
      setForm(f => ({ ...f, business_name: f.business_name || user.user_metadata.business_name }));
    }
  }, [user]);

  // Redirect if not authenticated or already onboarded
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (clientChecked && client) router.replace('/');
  }, [authLoading, user, clientChecked, client, router]);

  const set = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  const previewClient: Client = {
    id: user?.id || '',
    email: user?.email || '',
    business_name: form.business_name || 'Mon Commerce',
    organization_name: form.organization_name || '',
    card_name: form.card_name || 'Carte Fidélité',
    total_stamps: Number(form.total_stamps) || 5,
    reward_description: form.reward_description || 'Récompense gratuite',
    primary_color: form.primary_color,
    logo_url: logoUrl,
    google_wallet_class_id: null,
    created_at: new Date().toISOString(),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.organization_name || !form.card_name || !form.reward_description) {
      toast.error('Tous les champs obligatoires doivent être remplis.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createClient.mutateAsync({
        business_name: form.business_name,
        organization_name: form.organization_name,
        card_name: form.card_name,
        total_stamps: Number(form.total_stamps),
        reward_description: form.reward_description,
        primary_color: form.primary_color,
        logo_url: logoUrl,
      });
      console.log('[Onboarding] client created:', result);

      // Crée la LoyaltyClass Google Wallet pour ce commerçant
      try {
        await fetch('/api/google-wallet/create-class', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: result.id }),
        });
      } catch (gwErr) {
        console.warn('[Onboarding] Google Wallet class creation failed (non-blocking):', gwErr);
      }

      toast.success('Votre carte est prête! 🎉');
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
        toast.error('Un profil existe déjà pour ce compte.');
        router.push('/');
      } else if (msg.includes('violates row-level security') || msg.includes('42501')) {
        toast.error(`Erreur de permission: ${msg}`);
      } else {
        toast.error(`Erreur: ${msg || 'Une erreur est survenue. Réessayez.'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#00704A' }} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}
    >
      <div className="min-h-full py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: '#00704A' }}
            >
              W
            </div>
            <span
              className="text-xl font-bold text-ink"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              WalletPass Pro
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h1
                className="text-2xl font-bold text-ink mb-1"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Configurez votre carte de fidélité
              </h1>
              <p className="text-mist text-sm mb-7">Quelques informations pour démarrer</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {"Nom de l'entreprise *"}
                  </label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={e => set('business_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                    placeholder="ex. Café Montréal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {"Nom de l'organisation *"}
                  </label>
                  <input
                    type="text"
                    value={form.organization_name}
                    onChange={e => set('organization_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                    placeholder="ex. Groupe Café Inc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Nom de la carte *
                  </label>
                  <input
                    type="text"
                    value={form.card_name}
                    onChange={e => set('card_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                    placeholder="ex. Carte Récompenses"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Logo (PNG)
                  </label>
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                    )}
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-ink hover:border-matcha hover:text-matcha transition-all disabled:opacity-60"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {logoUrl ? 'Changer le logo' : 'Téléverser un logo'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Nombre de tampons requis *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={form.total_stamps}
                      onChange={e => set('total_stamps', Number(e.target.value))}
                      className="flex-1 accent-matcha"
                    />
                    <span
                      className="w-10 text-center text-ink font-bold text-lg"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {form.total_stamps}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Description de la récompense *
                  </label>
                  <input
                    type="text"
                    value={form.reward_description}
                    onChange={e => set('reward_description', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                    placeholder="ex. Café gratuit"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Couleur principale
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={e => set('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={e => set('primary_color', e.target.value)}
                      className="w-32 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 mt-2"
                  style={{ background: '#00704A' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Création de votre carte…
                    </>
                  ) : (
                    'Créer ma carte 🎁'
                  )}
                </button>
              </form>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-10">
              <p className="text-mist text-sm font-medium text-center mb-4 uppercase tracking-wide">
                Aperçu en direct
              </p>
              <div className="flex justify-center">
                <LoyaltyCard client={previewClient} punches={2} />
              </div>
              <p className="text-mist/60 text-xs text-center mt-4">
                Votre carte se met à jour en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
