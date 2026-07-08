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

      // Envoie en parallèle : message GW + notification push web (non-bloquant)
      await Promise.allSettled([
        fetch('/api/google-wallet/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: user.id, title, message }),
        }),
        fetch('/api/web-push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: user.id, title, message }),
        }),
      ]);

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
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return { notifications, isLoading, sendNotification };
}
