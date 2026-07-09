import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', user.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const sendNotification = useMutation({
    mutationFn: async ({
      title,
      message,
      recipientsCount,
    }: {
      title: string;
      message: string;
      recipientsCount: number;
    }) => {
      if (!user) throw new Error('Non authentifié');

      // Envoi via Google Wallet : le message s'attache à la carte du membre
      // et Google le pousse comme notification sur le téléphone.
      const gwRes = await fetch('/api/google-wallet/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.id, title, message }),
      });

      let gwResult: { sent: number; failed: number; total: number } | null = null;
      if (gwRes.ok) {
        try { gwResult = await gwRes.json(); } catch { /* ignore */ }
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          client_id: user.id,
          title: title || null,
          message,
          recipients_count: recipientsCount,
        })
        .select()
        .single();
      if (error) throw error;
      return { notification: data as Notification, gwResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return { notifications, isLoading, sendNotification };
}
