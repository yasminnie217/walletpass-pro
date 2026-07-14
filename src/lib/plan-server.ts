import type { SupabaseClient } from '@supabase/supabase-js';
import { planStatus } from './plan';

/** Vérifie si un commerçant a l'accès complet (Pro ou essai actif). */
export async function clientHasAccess(supabase: SupabaseClient, clientId: string): Promise<boolean> {
  const { data } = await supabase
    .from('clients')
    .select('plan, trial_ends_at')
    .eq('id', clientId)
    .single();
  return planStatus(data).hasAccess;
}
