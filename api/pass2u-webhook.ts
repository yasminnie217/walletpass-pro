import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: 'Missing Supabase configuration' });
    return;
  }

  const baseHeaders = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  async function dbGet(table: string, query: string) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: baseHeaders });
    return r.json();
  }

  async function dbInsert(table: string, body: Record<string, unknown>) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    });
  }

  async function dbPatch(table: string, filter: string, body: Record<string, unknown>) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { ...baseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    });
  }

  try {
    const payload = req.body || {};
    const event: string = payload.event;
    const data: Record<string, string> = payload.data || {};

    console.log(`[Pass2U webhook] event=${event}`, data);

    if (event === 'pass.created') {
      const { pass_id, name, email, model_id } = data;

      const clients = await dbGet(
        'clients',
        `pass2u_model_id=eq.${encodeURIComponent(model_id)}&select=id,total_stamps`
      );
      if (!Array.isArray(clients) || !clients.length) {
        res.status(404).json({ error: 'Client introuvable pour ce model_id' });
        return;
      }
      const client = clients[0];

      const parts = (name || '').trim().split(/\s+/);
      const first_name = parts[0] || 'Membre';
      const last_name = parts.slice(1).join(' ') || '';

      await dbInsert('members', {
        client_id: client.id,
        first_name,
        last_name,
        email: email || '',
        pass_id: String(pass_id),
        punches: 0,
        status: 'active',
      });

      console.log(`[Pass2U webhook] Member created: ${first_name} ${last_name}`);

    } else if (event === 'punch.added') {
      const { pass_id } = data;

      const members = await dbGet(
        'members',
        `pass_id=eq.${encodeURIComponent(pass_id)}&select=id,client_id,punches`
      );
      if (!Array.isArray(members) || !members.length) {
        res.status(404).json({ error: 'Membre introuvable pour ce pass_id' });
        return;
      }
      const member = members[0] as { id: string; client_id: string; punches: number };

      const clientRows = await dbGet('clients', `id=eq.${member.client_id}&select=total_stamps`);
      const totalStamps: number = Array.isArray(clientRows) ? (clientRows[0]?.total_stamps || 5) : 5;

      const newPunches = (member.punches || 0) + 1;
      const rewardAvailable = newPunches >= totalStamps;

      await dbPatch('members', `id=eq.${member.id}`, {
        punches: newPunches,
        reward_available: rewardAvailable,
      });
      await dbInsert('punches', {
        member_id: member.id,
        client_id: member.client_id,
      });

      console.log(
        `[Pass2U webhook] Punch added: member=${member.id} punches=${newPunches}/${totalStamps}`
      );
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Pass2U webhook error]', err);
    res.status(500).json({ error: 'Erreur interne du webhook' });
  }
}
