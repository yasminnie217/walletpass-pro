import { createClient } from '@supabase/supabase-js';
import { updateLoyaltyClass, buildClassId } from '@/lib/google-wallet';
import { createSupabaseServer } from '@/src/lib/supabase-server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(req: Request) {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const body = await req.json() as {
      programName?: string;
      issuerName?: string;
      logoUrl?: string;
      hexBackgroundColor?: string;
    };

    // Recalcule le classId depuis l'utilisateur authentifié — on n'accepte pas classId du body
    const supabase = getSupabase();
    const { data: client } = await supabase
      .from('clients')
      .select('google_wallet_class_id')
      .eq('id', user.id)
      .single();

    const classId = client?.google_wallet_class_id ?? buildClassId(user.id);

    await updateLoyaltyClass(classId, body);

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };
    console.error('[update-class]', e.response?.data ?? e.message);
    return Response.json(
      { error: 'Erreur mise à jour LoyaltyClass', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
