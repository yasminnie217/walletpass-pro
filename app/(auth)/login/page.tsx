'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Check, Circle } from 'lucide-react';
import { getPasswordChecks, validatePasswordRules } from '@/src/lib/password';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [signupForm, setSignupForm] = useState({ business_name: '', email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();

      if (res.status === 429) {
        const min = Math.ceil((data.retryAfterSeconds ?? 900) / 60);
        toast.error(`Trop de tentatives. Réessayez dans ${min} minute${min > 1 ? 's' : ''}.`);
        return;
      }
      if (res.status === 403 && data.error === 'email_not_confirmed') {
        setPendingEmail(loginForm.email);
        return;
      }
      if (!res.ok || !data.session) {
        toast.error('Identifiants incorrects. Veuillez réessayer.');
        return;
      }

      // Persiste la session via le client navigateur (cookies)
      const { error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (error) throw error;
      router.push('/dashboard');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.business_name || !signupForm.email || !signupForm.password) {
      toast.error('Tous les champs sont obligatoires.');
      return;
    }
    const { valid, errors } = validatePasswordRules(signupForm.password);
    if (!valid) {
      toast.error(`Mot de passe trop faible : ${errors.join(', ').toLowerCase()}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          business_name: signupForm.business_name,
        }),
      });
      const data = await res.json();

      if (res.status === 409 || data.error === 'already_registered') {
        toast.error('Ce courriel est déjà inscrit.');
        return;
      }
      if (data.error === 'pwned_password') {
        toast.error('Ce mot de passe a déjà été exposé dans une fuite de données. Choisissez-en un autre.');
        return;
      }
      if (data.error === 'weak_password') {
        toast.error(`Mot de passe trop faible : ${(data.reasons ?? []).join(', ').toLowerCase()}.`);
        return;
      }
      if (!res.ok) {
        toast.error('Une erreur est survenue. Réessayez.');
        return;
      }
      setPendingEmail(signupForm.email);
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail });
      if (error) throw error;
      toast.success('Courriel renvoyé !');
    } catch {
      toast.error('Erreur lors du renvoi. Réessayez.');
    } finally {
      setResending(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error('Entrez votre courriel.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, redirectTo: `${window.location.origin}/login` }),
      });
      const data = await res.json();

      if (res.status === 429) {
        const min = Math.ceil((data.retryAfterSeconds ?? 3600) / 60);
        toast.error(`Trop de demandes. Réessayez dans ${min} minute${min > 1 ? 's' : ''}.`);
        return;
      }
      toast.success('Courriel de réinitialisation envoyé!');
      setTab('login');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}>
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3" style={{ background: '#00704A' }}>W</div>
            <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>Fidely</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#00704A15' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#00704A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h2 className="text-ink font-bold text-lg mb-2">Vérifiez votre courriel</h2>
            <p className="text-mist text-sm mb-1">Un lien de confirmation a été envoyé à</p>
            <p className="text-ink font-medium text-sm mb-6">{pendingEmail}</p>
            <p className="text-mist text-xs mb-6">Cliquez sur le lien dans le courriel pour activer votre compte. Vérifiez aussi vos indésirables.</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 rounded-full font-medium text-sm border border-gray-200 text-ink hover:bg-cream transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {resending && <Loader2 size={14} className="animate-spin" />}
              Renvoyer le courriel
            </button>
            <button onClick={() => setPendingEmail(null)} className="mt-3 text-xs text-mist hover:text-ink transition-colors">
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3"
            style={{ background: '#00704A' }}
          >
            F
          </div>
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Fidely
          </h1>
          <p className="text-mist text-sm mt-1">Gérez vos cartes de fidélité digitales</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="flex rounded-full bg-cream p-1 mb-6">
              {(['login', 'signup'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    tab === t ? 'bg-white shadow-sm text-ink' : 'text-mist'
                  }`}
                >
                  {t === 'login' ? 'Connexion' : 'Créer un compte'}
                </button>
              ))}
            </div>
          )}

          {tab === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-ink font-semibold">Réinitialiser le mot de passe</p>
                <p className="text-mist text-sm mt-1">Entrez votre courriel et nous vous enverrons un lien.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Envoyer le lien
              </button>
              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-full py-2 text-mist text-sm hover:text-ink transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Connexion
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-mist text-xs">OU</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="text-xs text-mist hover:text-ink transition-colors"
                >
                  Mot de passe oublié?
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full py-2.5 rounded-full text-ink text-sm font-medium border border-gray-200 flex items-center justify-center gap-2 hover:bg-cream transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">{"Nom de l'entreprise"}</label>
                <input
                  type="text"
                  value={signupForm.business_name}
                  onChange={e => setSignupForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="Mon Commerce"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha transition-all"
                  placeholder="••••••••"
                  required
                />
                {signupForm.password && (
                  <ul className="mt-2.5 space-y-1">
                    {getPasswordChecks(signupForm.password).map(c => (
                      <li
                        key={c.label}
                        className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-matcha' : 'text-mist'}`}
                      >
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
                Créer mon compte
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-mist text-xs mt-6">
          © 2026 Fidely. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
