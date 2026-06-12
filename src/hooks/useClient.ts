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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      // maybeSingle returns null (not error) when no row found
      if (error) throw error;
      return (data as Client) ?? null;
    },
    enabled: !!user,
  });

  // true once the query has completed at least once (success or error)
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
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', user?.id] });
    },
  });

  const createClient = useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...newClient, id: user.id, email: user.email })
        .select()
        .single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', user?.id] });
    },
  });

  return { client, isLoading, clientChecked, updateClient, createClient };
}
