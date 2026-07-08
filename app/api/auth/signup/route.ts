import { createClient } from '@supabase/supabase-js';
import { validatePasswordRules, isPasswordPwned } from '@/src/lib/password';

export async function POST(req: Request) {
  try {
    const { email, password, business_name } = await req.json() as {
      email: string;
      password: string;
      business_name: string;
    };

    if (!email || !password || !business_name) {
      return Response.json({ error: 'missing_fields' }, { status: 400 });
    }

    // 1. Règles de complexité
    const { valid, errors } = validatePasswordRules(password);
    if (!valid) {
      return Response.json({ error: 'weak_password', reasons: errors }, { status: 400 });
    }

    // 2. Mot de passe compromis (Have I Been Pwned)
    if (await isPasswordPwned(password)) {
      return Response.json({ error: 'pwned_password' }, { status: 400 });
    }

    // 3. Création du compte
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name } },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return Response.json({ error: 'already_registered' }, { status: 409 });
      }
      return Response.json({ error: 'signup_failed', message: error.message }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[auth/signup]', e.message);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}
