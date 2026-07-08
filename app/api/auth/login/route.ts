import { createClient } from '@supabase/supabase-js';
import { checkBlocked, recordAttempt, clearAttempts, getClientIp } from '@/src/lib/rate-limit';

const MAX_ATTEMPTS = 5;        // 5 tentatives échouées
const WINDOW_SECONDS = 15 * 60; // sur une fenêtre de 15 minutes

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };
    if (!email || !password) {
      return Response.json({ error: 'Courriel et mot de passe requis' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const key = `login:${ip}:${email.toLowerCase()}`;

    // 1. Bloqué ?
    const { blocked, retryAfterSeconds } = await checkBlocked(key, MAX_ATTEMPTS);
    if (blocked) {
      return Response.json(
        { error: 'too_many_attempts', retryAfterSeconds },
        { status: 429 }
      );
    }

    // 2. Tentative de connexion
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      // Mot de passe correct mais email non confirmé → on ne compte pas comme échec
      if (error?.message.toLowerCase().includes('email not confirmed')) {
        return Response.json({ error: 'email_not_confirmed' }, { status: 403 });
      }
      await recordAttempt(key, WINDOW_SECONDS);
      return Response.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    // 3. Succès → reset du compteur, on renvoie la session au client
    await clearAttempts(key);
    return Response.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[auth/login]', e.message);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}
