import { createClient } from '@supabase/supabase-js';
import { updateLoyaltyObject } from '@/lib/google-wallet';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { memberId, newPoints: newPointsFromCaller } = await req.json() as { memberId: string; newPoints?: number };
    if (!memberId) {
      return Response.json({ error: 'memberId manquant' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: member, error } = await supabase
      .from('members')
      .select('id,punches,google_wallet_object_id,client_id')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return Response.json({ error: 'Membre introuvable' }, { status: 404 });
    }

    if (!member.google_wallet_object_id) {
      return Response.json({ ok: true, skipped: true });
    }

    const newPoints = newPointsFromCaller ?? (member.punches ?? 0) + 1;

    const { data: clientData } = await supabase
      .from('clients')
      .select('total_stamps')
      .eq('id', member.client_id)
      .single();

    await updateLoyaltyObject(member.google_wallet_object_id, {
      points: newPoints,
      totalStamps: clientData?.total_stamps ?? 10,
    });

    return Response.json({ ok: true, newPoints });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };
    console.error('[add-punch GW]', e.response?.data ?? e.message);
    // Non-bloquant : on retourne ok=false mais pas d'erreur 5xx
    // (la mise à jour Supabase a déjà été faite en amont dans le flow membres)
    return Response.json(
      { ok: false, error: 'Erreur mise à jour GW', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
