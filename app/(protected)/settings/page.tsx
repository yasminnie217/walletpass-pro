'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Loader2, LogOut, Upload, MapPin, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useClient } from '@/src/hooks/useClient';
import { useAuth } from '@/src/hooks/useAuth';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { Sidebar } from '@/src/components/Sidebar';
import { AddressAutocomplete } from '@/src/components/AddressAutocomplete';
import { usePlan } from '@/src/hooks/usePlan';

export default function Settings() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { client, updateClient } = useClient();
  const { hasAccess } = usePlan();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [origin, setOrigin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: '',
    email: '',
    logo_url: '',
    primary_color: '#00704A',
    latitude: null as number | null,
    longitude: null as number | null,
    store_address: '',
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (client) {
      setForm({
        business_name: client.business_name || '',
        email: client.email || '',
        logo_url: client.logo_url || '',
        primary_color: client.primary_color || '#00704A',
        latitude: client.latitude ?? null,
        longitude: client.longitude ?? null,
        store_address: client.store_address || '',
      });
    }
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClient.mutateAsync({
        business_name: form.business_name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        latitude: form.latitude,
        longitude: form.longitude,
        store_address: form.store_address || null,
      });

      // Répercute le logo et la couleur sur la carte Google Wallet
      if (client?.google_wallet_class_id) {
        try {
          await fetch('/api/google-wallet/update-class', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logoUrl: form.logo_url || undefined,
              hexBackgroundColor: form.primary_color,
            }),
          });
        } catch {
          // non-bloquant
        }
      }

      toast.success('Paramètres sauvegardés.');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', user.id);
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, logo_url: data.url }));
      toast.success('Logo uploadé !');
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
      input.value = ''; // permet de re-sélectionner le même fichier
    }
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          store_address: 'Position actuelle',
        }));
        setLocating(false);
        toast.success('Position captée. N’oubliez pas d’enregistrer.');
      },
      () => {
        setLocating(false);
        toast.error("Impossible d'obtenir la position (permission refusée ?).");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddressSelect = (r: { latitude: number; longitude: number; address: string }) => {
    setForm(f => ({
      ...f,
      latitude: r.latitude,
      longitude: r.longitude,
      store_address: r.address,
    }));
    toast.success('Adresse trouvée. N’oubliez pas d’enregistrer.');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8" style={{ background: '#F9F6F0' }}>
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
                <label className="block text-sm font-medium text-ink mb-1.5">{"Nom de l'entreprise"}</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">{"Courriel d'affaires"}</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-cream text-mist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo_url && (
                    <img src={form.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-ink hover:border-matcha hover:text-matcha transition-all disabled:opacity-60"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {form.logo_url ? 'Changer le logo' : 'Choisir un logo'}
                  </button>
                </div>
                <p className="text-xs text-mist mt-2">
                  Format carré recommandé (512×512 px, PNG). Le logo s&apos;affiche dans un cercle sur Google Wallet.
                </p>
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
              {/* Position du magasin — notifications de proximité */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-ink mb-1">Position du magasin</label>
                <p className="text-xs text-mist mb-3">
                  Permet à Google Wallet d&apos;afficher la carte du membre sur son écran de
                  verrouillage quand il passe près de votre commerce.
                </p>

                {hasAccess ? (
                  <>
                    {/* Recherche d'adresse Google Maps */}
                    <div className="mb-2">
                      <AddressAutocomplete onSelect={handleAddressSelect} />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-mist">ou</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-ink hover:border-matcha hover:text-matcha transition-all disabled:opacity-60"
                    >
                      {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                      Utiliser ma position actuelle
                    </button>

                    {form.latitude != null && form.longitude != null && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-ink">
                        <MapPin size={15} style={{ color: '#00704A' }} />
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}>
                          {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, latitude: null, longitude: null, store_address: '' }))}
                          className="text-mist hover:text-error text-xs ml-1"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/abonnement" className="flex items-center gap-2.5 rounded-xl p-3 transition-all hover:opacity-90"
                    style={{ background: '#CBA25815', border: '1px solid #CBA258' }}>
                    <Crown size={18} style={{ color: '#CBA258' }} />
                    <span className="text-ink text-sm font-medium">Réservé au plan Pro — passer au Pro →</span>
                  </Link>
                )}
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
