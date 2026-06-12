import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      pass2uWebhookPlugin(env),
    ],
  };
});

function pass2uWebhookPlugin(env: Record<string, string>): Plugin {
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  // Use service role key if provided (bypasses RLS), otherwise anon key
  const SERVICE_KEY =
    env.VITE_SUPABASE_SERVICE_ROLE_KEY &&
    env.VITE_SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here'
      ? env.VITE_SUPABASE_SERVICE_ROLE_KEY
      : env.VITE_SUPABASE_ANON_KEY;

  const baseHeaders = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  async function dbGet(table: string, query: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: baseHeaders,
    });
    return res.json();
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

  return {
    name: 'pass2u-webhook',
    configureServer(server) {
      server.middlewares.use(
        '/api/public/pass2u-webhook',
        (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
          }

          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const raw = Buffer.concat(chunks).toString();
              const payload = JSON.parse(raw || '{}');
              const event: string = payload.event;
              const data: Record<string, unknown> = payload.data || {};

              console.log(`[Pass2U webhook] event=${event}`, data);

              if (event === 'pass.created') {
                const { pass_id, name, email, model_id } = data as Record<string, string>;

                // Find client by model_id
                const clients = await dbGet(
                  'clients',
                  `pass2u_model_id=eq.${encodeURIComponent(model_id)}&select=id,total_stamps`
                );
                if (!Array.isArray(clients) || !clients.length) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Client introuvable pour ce model_id' }));
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
                const { pass_id } = data as Record<string, string>;

                const members = await dbGet(
                  'members',
                  `pass_id=eq.${encodeURIComponent(pass_id)}&select=id,client_id,punches`
                );
                if (!Array.isArray(members) || !members.length) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: 'Membre introuvable pour ce pass_id' }));
                  return;
                }
                const member = members[0] as { id: string; client_id: string; punches: number };

                const clientRows = await dbGet(
                  'clients',
                  `id=eq.${member.client_id}&select=total_stamps`
                );
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

              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              console.error('[Pass2U webhook error]', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erreur interne du webhook' }));
            }
          });
        }
      );
    },
  };
}
