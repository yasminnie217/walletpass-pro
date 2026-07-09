import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/src/lib/supabase-server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Échappe une valeur pour CSV
function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export async function GET() {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return new Response('Non authentifié', { status: 401 });

  const supabase = getSupabase();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Membres du commerçant
  const { data: members } = await supabase
    .from('members')
    .select('first_name,last_name,email,punches,status,reward_available,created_at')
    .eq('client_id', user.id);

  // Tampons du mois courant
  const { data: punches } = await supabase
    .from('punches')
    .select('created_at')
    .eq('client_id', user.id)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  const allMembers = members ?? [];
  const monthPunches = punches ?? [];

  const totalMembers = allMembers.length;
  const activeMembers = allMembers.filter((m) => m.status === 'active').length;
  const rewardsReady = allMembers.filter((m) => m.reward_available).length;
  const newThisMonth = allMembers.filter(
    (m) => m.created_at && new Date(m.created_at) >= start
  ).length;

  // Répartition des tampons par jour du mois
  const perDay: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) perDay[d] = 0;
  monthPunches.forEach((p) => {
    const day = new Date(p.created_at).getDate();
    perDay[day] = (perDay[day] || 0) + 1;
  });

  const monthLabel = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const pad = (n: number) => String(n).padStart(2, '0');

  const rows: string[] = [];
  rows.push([cell('Statistiques du mois'), cell(monthLabel)].join(','));
  rows.push('');
  rows.push('Résumé,');
  rows.push([cell('Total membres'), cell(totalMembers)].join(','));
  rows.push([cell('Cartes actives'), cell(activeMembers)].join(','));
  rows.push([cell('Récompenses prêtes'), cell(rewardsReady)].join(','));
  rows.push([cell('Tampons ce mois'), cell(monthPunches.length)].join(','));
  rows.push([cell('Nouveaux membres ce mois'), cell(newThisMonth)].join(','));
  rows.push('');
  rows.push('Détail par jour,');
  rows.push([cell('Date'), cell('Tampons')].join(','));
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
    rows.push([cell(date), cell(perDay[d])].join(','));
  }
  rows.push('');
  rows.push('Membres,');
  rows.push([cell('Prénom'), cell('Nom'), cell('Courriel'), cell('Tampons'), cell('Statut'), cell('Récompense prête')].join(','));
  allMembers.forEach((m) => {
    rows.push([
      cell(m.first_name),
      cell(m.last_name),
      cell(m.email),
      cell(m.punches),
      cell(m.status),
      cell(m.reward_available ? 'oui' : 'non'),
    ].join(','));
  });

  // BOM pour qu'Excel lise correctement les accents
  const csv = '﻿' + rows.join('\n');
  const filename = `stats-${now.getFullYear()}-${pad(now.getMonth() + 1)}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
