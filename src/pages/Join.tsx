import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createPass } from '../lib/pass2u';
import { LoyaltyCard } from '../components/LoyaltyCard';
import type { Client } from '../types';

export default function Join() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setClient(data as Client);
        setLoadingClient(false);
      });
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.first_name || !form.last_name || !form.email) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!clientId || !client) {
      setError('Une erreur est survenue. Réessayez.');
      return;
    }

    setSubmitting(true);
    try {
      // Check duplicate email
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('client_id', clientId)
        .eq('email', form.email)
        .maybeSingle();

      if (existing) {
        setError('Ce courriel est déjà inscrit.');
        setSubmitting(false);
        return;
      }

      // Insert member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          client_id: clientId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          punches: 0,
          status: 'active',
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Create Pass2U pass
      let passUrl: string | null = null;
      try {
        const passData = await createPass(
          `${form.first_name} ${form.last_name}`,
          form.email
        );
        const passId = passData.passId || passData.id || passData.pass_id;
        passUrl = passData.passUrl || passData.url || passData.pass_url;
        if (passId) {
          await supabase.from('members').update({ pass_id: String(passId) }).eq('id', member.id);
        }
      } catch {
        // Pass2U non-blocking
      }

      setSuccess(true);

      if (passUrl) {
        setTimeout(() => {
          window.location.href = passUrl!;
        }, 1500);
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0' }}>
        <Loader2 className="animate-spin text-matcha" size={32} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}>
        <div className="text-center">
          <p className="text-ink font-semibold">Commerce introuvable.</p>
          <p className="text-mist text-sm mt-1">Vérifiez le lien et réessayez.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}
    >
      <div className="max-w-sm mx-auto">
        {/* App logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#00704A' }}
          >
            W
          </div>
          <span className="font-semibold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
            WalletPass Pro
          </span>
        </div>

        {/* Card preview */}
        <div className="flex justify-center mb-6">
          <LoyaltyCard client={client} punches={0} />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Rejoignez {client.business_name}
          </h1>
          <p className="text-mist mt-1">Obtenez votre carte de fidélité gratuite</p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#00704A' }} />
            <h2 className="text-ink font-semibold text-lg">Bienvenue!</h2>
            <p className="text-mist text-sm mt-1">Votre carte a été créée. Redirection vers votre carte…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Prénom *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="Marie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nom de famille *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="Tremblay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="marie@exemple.com"
                />
              </div>

              {error && (
                <p className="text-error text-sm font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création de votre carte en cours…
                  </>
                ) : (
                  'Obtenir ma carte gratuite 🎁'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
