import { createClient } from '@supabase/supabase-js';
import { updateLoyaltyObject } from '@/lib/google-wallet';
import { createSupabaseServer } from '@/src/lib/supabase-server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const { memberId, newPoints: newPointsFromCaller } = await req.json() as { memberId: string; newPoints?: number };
    if (!memberId) {
      return Response.json({ error: 'memberId manquant' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifie que le membre appartient bien au client authentifié
    const { data: member, error } = await supabase
      .from('members')
      .select('id,punches,google_wallet_object_id,client_id')
      .eq('id', memberId)
      .eq('client_id', user.id) // Protection : seul le bon commerçant peut modifier ses membres
      .single();

    if (error || !member) {
      return Response.json({ error: 'Membre introuvable ou accès refusé' }, { status: 404 });
    }

    if (!member.google_wallet_object_id) {
      return Response.json({ ok: true, skipped: true });
    }

    const newPoints = newPointsFromCaller ?? (member.punches ?? 0) + 1;

    // Total de tampons requis pour afficher "X / total" sur la carte
    const { data: clientData } = await supabase
      .from('clients')
      .select('total_stamps')
      .eq('id', member.client_id)
      .single();

    await updateLoyaltyObject(member.google_wallet_object_id, {
      points: newPoints,
      totalStamps: clientData?.total_stamps ?? undefined,
    });

    return Response.json({ ok: true, newPoints });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };
    console.error('[add-punch GW]', e.response?.data ?? e.message);
    return Response.json(
      { ok: false, error: 'Erreur mise à jour GW', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
