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
      pass2uResponse,
    }: {
      title: string;
      message: string;
      recipientsCount: number;
      pass2uResponse: string;
    }) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          client_id: user.id,
          title: title || null,
          message,
          recipients_count: recipientsCount,
          pass2u_response: pass2uResponse,
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
