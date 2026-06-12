import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useClient } from '../hooks/useClient';
import { LoyaltyCard } from '../components/LoyaltyCard';
import { updateModel } from '../lib/pass2u';
import type { Client } from '../types';

const MODEL_ID = import.meta.env.VITE_PASS2U_MODEL_ID;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createClient } = useClient();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    business_name: '',
    organization_name: '',
    card_name: '',
    total_stamps: 5,
    reward_description: '',
    primary_color: '#00704A',
  });

  const set = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  // Live preview client object
  const previewClient: Client = {
    id: user?.id || '',
    email: user?.email || '',
    business_name: form.business_name || 'Mon Commerce',
    organization_name: form.organization_name || '',
    card_name: form.card_name || 'Carte Fidélité',
    total_stamps: Number(form.total_stamps) || 5,
    reward_description: form.reward_description || 'Récompense gratuite',
    primary_color: form.primary_color,
    logo_url: null,
    pass2u_model_id: MODEL_ID,
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
      console.log('[Onboarding] user:', user?.id, user?.email);
      console.log('[Onboarding] form:', form);

      // Step 1 — save to Supabase
      const result = await createClient.mutateAsync({
        business_name: form.business_name,
        organization_name: form.organization_name,
        card_name: form.card_name,
        total_stamps: Number(form.total_stamps),
        reward_description: form.reward_description,
        primary_color: form.primary_color,
        pass2u_model_id: MODEL_ID,
      });
      console.log('[Onboarding] client created:', result);

      // Step 2 — update Pass2U model (non-blocking)
      try {
        await updateModel({ name: form.card_name, description: form.reward_description });
      } catch (pass2uErr) {
        console.warn('[Onboarding] Pass2U update failed (non-blocking):', pass2uErr);
      }

      // Step 3 — redirect
      toast.success('Votre carte est prête! 🎉');
      navigate('/card');
    } catch (err) {
      console.error('[Onboarding] FULL ERROR:', err);
      console.error('[Onboarding] error message:', err instanceof Error ? err.message : String(err));
      console.error('[Onboarding] error details:', JSON.stringify(err, null, 2));

      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
        toast.error('Un profil existe déjà pour ce compte.');
        navigate('/');
      } else if (msg.includes('violates row-level security') || msg.includes('42501')) {
        toast.error(`Erreur de permission: ${msg}`);
      } else {
        toast.error(`Erreur: ${msg || 'Une erreur est survenue. Réessayez.'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
                  Nom de l'entreprise *
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
                  Nom de l'organisation *
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
