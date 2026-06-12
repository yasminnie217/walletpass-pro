import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import { useAuth } from './useAuth';

export function useMembers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('client_id', user.id)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!user,
  });

  const addMember = useMutation({
    mutationFn: async (member: Omit<Member, 'id' | 'joined_at'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', user?.id] });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Member> }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['punches', user?.id] });
    },
  });

  return { members, isLoading, addMember, updateMember };
}
