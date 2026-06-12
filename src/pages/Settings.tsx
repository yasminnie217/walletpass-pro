import { useState, useEffect } from 'react';
import { Save, Loader2, LogOut, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../hooks/useClient';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/Sidebar';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { client, updateClient } = useClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    business_name: '',
    email: '',
    logo_url: '',
    primary_color: '#00704A',
  });

  useEffect(() => {
    if (client) {
      setForm({
        business_name: client.business_name || '',
        email: client.email || '',
        logo_url: client.logo_url || '',
        primary_color: client.primary_color || '#00704A',
      });
    }
  }, [client]);

  const webhookUrl = `${window.location.origin}/api/public/pass2u-webhook`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClient.mutateAsync({
        business_name: form.business_name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
      });
      toast.success('Paramètres sauvegardés.');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL copiée!');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
        <h1 className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
          Paramètres
        </h1>
        <p className="text-mist mb-8">Gérez votre compte et votre carte.</p>

        <div className="max-w-2xl space-y-6">
          {/* Account section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold text-base mb-4">Compte</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Courriel d'affaires</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-cream text-mist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">URL du logo</label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="https://exemple.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="w-32 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </form>
          </div>

          {/* Connected as */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold text-base mb-4">Connecté en tant que</h2>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: '#1E3932' }}
              >
                {user?.email?.substring(0, 2).toUpperCase() || 'WP'}
              </div>
              <div>
                <p className="text-ink font-medium text-sm">{client?.business_name || 'Mon Commerce'}</p>
                <p className="text-mist text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Pass2U integration */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold text-base mb-2">Intégration Pass2U</h2>
            <p className="text-mist text-sm mb-4">
              Configurez cette URL dans le tableau de bord Pass2U → Webhook pour recevoir les événements
              en temps réel (pass créé, tampon ajouté).
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1.5">URL du webhook Pass2U</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-cream text-mist"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                />
                <button
                  onClick={copyWebhook}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-ink hover:bg-cream transition-all"
                >
                  <Copy size={14} />
                  Copier
                </button>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#1E393210', border: '1px solid #1E393230' }}
            >
              <p className="font-medium text-ink mb-1">Pour tester en local</p>
              <p className="text-mist text-xs mb-2">
                Exposez votre serveur local avec ngrok, puis collez l'URL ngrok dans Pass2U.
              </p>
              <code
                className="block text-xs px-3 py-2 rounded-lg text-ink"
                style={{ background: '#1E3932', color: '#F9F6F0', fontFamily: '"JetBrains Mono", monospace' }}
              >
                npx ngrok http 5173
              </code>
            </div>
          </div>

          {/* Session */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold text-base mb-4">Session</h2>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm border border-error text-error hover:bg-error/5 transition-all"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
