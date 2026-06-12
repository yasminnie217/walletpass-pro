import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Punch } from '../types';
import { useAuth } from './useAuth';

export function usePunches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: punches = [], isLoading } = useQuery({
    queryKey: ['punches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('punches')
        .select('*, members(first_name, last_name)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Punch[];
    },
    enabled: !!user,
  });

  const addPunch = useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('punches')
        .insert({ member_id: memberId, client_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Punch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punches', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['members', user?.id] });
    },
  });

  const todayCount = punches.filter(p => {
    const today = new Date();
    const pDate = new Date(p.created_at);
    return pDate.toDateString() === today.toDateString();
  }).length;

  const weeklyData = (() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts: Record<string, number> = {};
    days.forEach(d => (counts[d] = 0));
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    punches.forEach(p => {
      const pDate = new Date(p.created_at);
      if (pDate >= startOfWeek) {
        const day = days[pDate.getDay()];
        counts[day] = (counts[day] || 0) + 1;
      }
    });

    return days.map(name => ({ name, tampons: counts[name] }));
  })();

  return { punches, isLoading, addPunch, todayCount, weeklyData };
}
