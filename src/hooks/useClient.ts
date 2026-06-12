import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';
import { useAuth } from './useAuth';

export function useClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: client, isLoading, isFetched } = useQuery({
    queryKey: ['client', user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('[useClient] fetching client for user:', user.id);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('[useClient] fetch error:', error);
        throw error;
      }
      console.log('[useClient] result:', data);
      return (data as Client) ?? null;
    },
    enabled: !!user,
  });

  const clientChecked = isFetched;

  const updateClient = useMutation({
    mutationFn: async (updates: Partial<Client>) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) {
        console.error('[useClient] update error:', error);
        throw new Error(error.message);
      }
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', user?.id] });
    },
  });

  const createClient = useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      if (!user) throw new Error('Non authentifié');

      const email = user.email;
      if (!email) throw new Error('Email utilisateur introuvable');

      console.log('[useClient] creating client:', { id: user.id, email, ...newClient });

      // Use upsert so re-submitting the form doesn't fail on duplicate
      const { data, error } = await supabase
        .from('clients')
        .upsert(
          { ...newClient, id: user.id, email },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('[useClient] create error code:', error.code);
        console.error('[useClient] create error message:', error.message);
        console.error('[useClient] create error details:', error.details);
        console.error('[useClient] create error hint:', error.hint);
        throw new Error(`${error.message} (code: ${error.code})`);
      }

      console.log('[useClient] client created successfully:', data);
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', user?.id] });
    },
  });

  return { client, isLoading, clientChecked, updateClient, createClient };
}
