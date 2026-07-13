import { supabase } from './supabase';

/** Enregistre l'utilisation d'une récompense dans l'historique (non-bloquant). */
export async function recordRedemption(
  memberId: string,
  clientId: string,
  rewardDescription?: string | null
) {
  const { error } = await supabase.from('redemptions').insert({
    member_id: memberId,
    client_id: clientId,
    reward_description: rewardDescription ?? null,
  });
  if (error) console.error('[recordRedemption]', error.message);
}
