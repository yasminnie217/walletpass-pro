import { createClient } from '@supabase/supabase-js';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Vérifie si une clé est bloquée (a atteint le nombre max de tentatives
 * dans la fenêtre courante). Ne modifie rien.
 */
export async function checkBlocked(
  key: string,
  maxAttempts: number
): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  const { data: row } = await admin()
    .from('rate_limits')
    .select('count, expires_at')
    .eq('key', key)
    .single();

  const now = Date.now();
  if (!row || new Date(row.expires_at).getTime() < now) {
    return { blocked: false, retryAfterSeconds: 0 };
  }
  if (row.count >= maxAttempts) {
    const retry = Math.ceil((new Date(row.expires_at).getTime() - now) / 1000);
    return { blocked: true, retryAfterSeconds: Math.max(retry, 1) };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

/**
 * Enregistre une tentative. Démarre une nouvelle fenêtre si aucune n'est
 * active, sinon incrémente le compteur de la fenêtre courante.
 */
export async function recordAttempt(key: string, windowSeconds: number): Promise<void> {
  const supabase = admin();
  const { data: row } = await supabase
    .from('rate_limits')
    .select('count, expires_at')
    .eq('key', key)
    .single();

  const now = Date.now();
  if (!row || new Date(row.expires_at).getTime() < now) {
    await supabase.from('rate_limits').upsert({
      key,
      count: 1,
      expires_at: new Date(now + windowSeconds * 1000).toISOString(),
    });
  } else {
    await supabase
      .from('rate_limits')
      .update({ count: row.count + 1 })
      .eq('key', key);
  }
}

/** Efface le compteur (ex: après une connexion réussie). */
export async function clearAttempts(key: string): Promise<void> {
  await admin().from('rate_limits').delete().eq('key', key);
}

/** Extrait l'IP du client depuis les en-têtes de la requête. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
