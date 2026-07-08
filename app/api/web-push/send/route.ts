import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT ?? 'admin@walletpass.pro'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

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

    const { data: members, error } = await supabase
      .from('members')
      .select('id, push_subscription')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .not('push_subscription', 'is', null);

    if (error) throw error;

    const payload = JSON.stringify({ title: title || 'Nouveau message', body: message });

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      (members ?? []).map(async (m) => {
        try {
          await webpush.sendNotification(m.push_subscription as webpush.PushSubscription, payload);
          sent++;
        } catch {
          failed++;
        }
      })
    );

    return Response.json({ sent, failed, total: members?.length ?? 0 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[web-push/send]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
