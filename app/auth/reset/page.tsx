'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Check, Circle } from 'lucide-react';
import { getPasswordChecks, validatePasswordRules, isPasswordPwned } from '@/src/lib/password';

export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Établit la session de récupération à partir des jetons du lien courriel
  useEffect(() => {
    const finish = (ok: boolean) => { setValidLink(ok); setReady(true); };
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const p = new URLSearchParams(hash.substring(1));
      const access_token = p.get('access_token');
      const refresh_token = p.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          window.history.replaceState(null, '', window.location.pathname);
          finish(!error);
        });
        return;
      }
    }
    // Pas de jeton dans l'URL : peut-être déjà une session active ?
    supabase.auth.getSession().then(({ data }) => finish(!!data.session));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors } = validatePasswordRules(password);
    if (!valid) {
      toast.error(`Mot de passe trop faible : ${errors.join(', ').toLowerCase()}.`);
      return;
    }
    setLoading(true);
    try {
      if (await isPasswordPwned(password)) {
        toast.error('Ce mot de passe a déjà été exposé dans une fuite de données. Choisissez-en un autre.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Mot de passe mis à jour !');
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      toast.error('Une erreur est survenue. Le lien a peut-être expiré — redemandez un courriel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3" style={{ background: '#00704A' }}>F</div>
          <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>Fidely</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!ready ? (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin" style={{ color: '#00704A' }} />
            </div>
          ) : !validLink ? (
            <div className="text-center py-4">
              <p className="text-ink font-semibold">Lien invalide ou expiré</p>
              <p className="text-mist text-sm mt-1 mb-4">Redemandez un courriel de réinitialisation.</p>
              <button onClick={() => router.push('/login')} className="text-sm font-medium" style={{ color: '#00704A' }}>
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-ink font-semibold">Nouveau mot de passe</p>
                <p className="text-mist text-sm mt-1">Choisissez un nouveau mot de passe pour votre compte.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="••••••••"
                  required
                />
                {password && (
                  <ul className="mt-2.5 space-y-1">
                    {getPasswordChecks(password).map(c => (
                      <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-matcha' : 'text-mist'}`}>
                        {c.ok ? <Check size={13} /> : <Circle size={13} />}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Mettre à jour le mot de passe
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
