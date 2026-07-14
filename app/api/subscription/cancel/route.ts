import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/src/lib/supabase-server';

// DÉMO : repasse en gratuit + termine l'essai (pour tester l'état limité).
export async function POST() {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Repasse en gratuit et met fin à l'essai
  const { error } = await supabase
    .from('clients')
    .update({ plan: 'free', trial_ends_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', user.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true, plan: 'free' });
}
