import { createClient } from '@supabase/supabase-js';
import { checkBlocked, recordAttempt, getClientIp } from '@/src/lib/rate-limit';

const MAX_REQUESTS = 3;         // 3 demandes
const WINDOW_SECONDS = 60 * 60; // par heure et par IP

export async function POST(req: Request) {
  try {
    const { email, redirectTo } = await req.json() as { email: string; redirectTo?: string };
    if (!email) {
      return Response.json({ error: 'Courriel requis' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const key = `reset:${ip}`;

    const { blocked, retryAfterSeconds } = await checkBlocked(key, MAX_REQUESTS);
    if (blocked) {
      return Response.json(
        { error: 'too_many_attempts', retryAfterSeconds },
        { status: 429 }
      );
    }

    // Chaque demande compte (protège contre l'envoi massif de courriels)
    await recordAttempt(key, WINDOW_SECONDS);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // On ignore volontairement le résultat pour ne pas révéler si le compte existe
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[auth/reset-password]', e.message);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}
