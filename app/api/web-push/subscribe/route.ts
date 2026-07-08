import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { memberId, subscription } = await req.json() as {
      memberId: string;
      subscription: PushSubscriptionJSON;
    };

    if (!memberId || !subscription) {
      return Response.json({ error: 'memberId et subscription requis' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('members')
      .update({ push_subscription: subscription })
      .eq('id', memberId);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[web-push/subscribe]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
