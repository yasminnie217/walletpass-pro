import { createClient } from '@supabase/supabase-js';
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
    const { memberId, rewardDescription } = await req.json() as {
      memberId: string;
      rewardDescription?: string | null;
    };
    if (!memberId) {
      return Response.json({ error: 'memberId requis' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifie que le membre appartient bien au commerçant authentifié
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('client_id', user.id)
      .single();
    if (!member) {
      return Response.json({ error: 'Membre introuvable ou accès refusé' }, { status: 404 });
    }

    const { error } = await supabase.from('redemptions').insert({
      member_id: memberId,
      client_id: user.id,
      reward_description: rewardDescription ?? null,
    });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[redemptions]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
