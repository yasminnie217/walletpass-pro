'use client';

import { useState } from 'react';
import { Send, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useMembers } from '@/src/hooks/useMembers';
import { Sidebar } from '@/src/components/Sidebar';
import { NotificationItem } from '@/src/components/NotificationItem';

export default function Notifications() {
  const { notifications, isLoading, sendNotification } = useNotifications();
  const { members } = useMembers();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const recipientsCount = members.filter(m => m.status === 'active' && m.google_wallet_object_id).length;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Le message est obligatoire.');
      return;
    }
    setSending(true);
    try {
      await sendNotification.mutateAsync({
        title,
        message,
        recipientsCount,
      });

      toast.success(`Notification envoyée à ${recipientsCount} membre(s).`);
      setTitle('');
      setMessage('');
    } catch {
      toast.error("Erreur lors de l'envoi de la notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F9F6F0' }}>
        <h1 className="text-3xl font-bold text-ink mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
          Notifications
        </h1>
        <p className="text-mist mb-8">Envoyez une notification à tous vos détenteurs de carte.</p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold mb-4">Nouvelle notification</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-ink">Titre (optionnel)</label>
                  <span className="text-xs text-mist">{title.length}/60</span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={60}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha"
                  placeholder="Titre de la notification…"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-ink">Message *</label>
                  <span className="text-xs text-mist">{message.length}/240</span>
                </div>
                <textarea
                  value={message}
                  maxLength={240}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30 focus:border-matcha resize-none"
                  placeholder="Votre message ici…"
                  required
                />
              </div>
              <p className="text-sm text-mist">
                Sera envoyée à <strong className="text-ink">{recipientsCount}</strong> membre(s)
              </p>
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00704A' }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Envoyer
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-ink font-semibold mb-4">Aperçu</h2>
            <div className="flex justify-center">
              <div
                className="w-64 rounded-3xl p-3 shadow-xl"
                style={{ background: '#1a1a1a' }}
              >
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#00704A' }}
                    >
                      <Bell size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {title || 'WalletPass Pro'}
                      </p>
                      <p className="text-white/70 text-xs mt-0.5 line-clamp-3">
                        {message || 'Votre message apparaîtra ici…'}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-2 text-right">maintenant</p>
                </div>
                <div className="h-1 w-24 bg-white/20 rounded-full mx-auto mt-3" />
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-ink font-semibold">Historique</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-matcha" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell size={36} className="text-mist/40 mb-3" />
              <p className="text-mist text-sm">Aucune notification envoyée.</p>
            </div>
          ) : (
            notifications.map(n => <NotificationItem key={n.id} notification={n} />)
          )}
        </div>
      </main>
    </div>
  );
}
