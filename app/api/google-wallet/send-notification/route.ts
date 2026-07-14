import { createClient } from '@supabase/supabase-js';
import { addMessageToObject } from '@/lib/google-wallet';
import { createSupabaseServer } from '@/src/lib/supabase-server';
import { clientHasAccess } from '@/src/lib/plan-server';

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
    const { title, message } = await req.json() as { title?: string; message: string };
    const clientId = user.id;

    if (!message) {
      return Response.json({ error: 'message requis' }, { status: 400 });
    }

    const supabase = getSupabase();

    if (!(await clientHasAccess(supabase, clientId))) {
      return Response.json({ error: 'plan_required' }, { status: 403 });
    }

    const { data: members, error } = await supabase
      .from('members')
      .select('id, google_wallet_object_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .not('google_wallet_object_id', 'is', null);

    if (error) throw error;

    const header = title || 'Nouveau message';
    console.log(`[send-notification] client ${clientId} — ${members?.length ?? 0} carte(s) ciblée(s), header="${header}"`);
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      (members ?? []).map(async (m) => {
        try {
          await addMessageToObject(m.google_wallet_object_id!, header, message);
          sent++;
        } catch (err: unknown) {
          failed++;
          const e = err as { message?: string };
          console.error(`[send-notification] échec objet ${m.google_wallet_object_id}:`, e.message);
        }
      })
    );

    console.log(`[send-notification] résultat: ${sent} envoyé(s), ${failed} échec(s)`);
    return Response.json({ sent, failed, total: members?.length ?? 0 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[send-notification]', e.message);
    return Response.json({ error: e.message ?? 'Erreur inconnue' }, { status: 500 });
  }
}
