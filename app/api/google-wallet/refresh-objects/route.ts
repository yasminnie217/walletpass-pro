import { createClient } from '@supabase/supabase-js';
import { updateLoyaltyObject } from '@/lib/google-wallet';
import { createSupabaseServer } from '@/src/lib/supabase-server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Réapplique le total de tampons requis (affichage "X / total") sur toutes les
// cartes membres du commerçant — utile quand il change total_stamps.
export async function POST() {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const supabase = getSupabase();

    const { data: client } = await supabase
      .from('clients')
      .select('total_stamps')
      .eq('id', user.id)
      .single();
    const totalStamps = client?.total_stamps ?? undefined;

    const { data: members } = await supabase
      .from('members')
      .select('id, punches, google_wallet_object_id')
      .eq('client_id', user.id)
      .not('google_wallet_object_id', 'is', null);

    let updated = 0;
    let failed = 0;
    await Promise.allSettled(
      (members ?? []).map(async (m) => {
        try {
          await updateLoyaltyObject(m.google_wallet_object_id!, {
            points: m.punches ?? 0,
            totalStamps,
          });
          updated++;
        } catch {
          failed++;
        }
      })
    );

    return Response.json({ updated, failed, total: members?.length ?? 0 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[refresh-objects]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
