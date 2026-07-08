import { createClient } from '@supabase/supabase-js';
import { addMessageToObject } from '@/lib/google-wallet';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { clientId, title, message } = await req.json() as {
      clientId: string;
      title?: string;
      message: string;
    };

    if (!clientId || !message) {
      return Response.json({ error: 'clientId et message requis' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Récupère tous les membres actifs avec une carte GW
    const { data: members, error } = await supabase
      .from('members')
      .select('id, google_wallet_object_id')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .not('google_wallet_object_id', 'is', null);

    if (error) throw error;

    const header = title || 'Nouveau message';
    let sent = 0;
    let failed = 0;

    // Envoie le message à chaque carte en parallèle
    await Promise.allSettled(
      (members ?? []).map(async (m) => {
        try {
          await addMessageToObject(m.google_wallet_object_id!, header, message);
          sent++;
        } catch {
          failed++;
        }
      })
    );

    return Response.json({ sent, failed, total: members?.length ?? 0 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[send-notification]', e.message);
    return Response.json({ error: e.message ?? 'Erreur inconnue' }, { status: 500 });
  }
}
