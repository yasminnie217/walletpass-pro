import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/src/lib/supabase-server';
import ExcelJS from 'exceljs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const GREEN = 'FF00704A';
const GOLD = 'FFCBA258';
const LIGHT = 'FFF1EDE4';
const WHITE = 'FFFFFFFF';

function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';

  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return new Response('Non authentifié', { status: 401 });

  const supabase = getSupabase();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const [{ data: clientData }, { data: members }, { data: punches }] = await Promise.all([
    supabase.from('clients').select('business_name').eq('id', user.id).single(),
    supabase
      .from('members')
      .select('first_name,last_name,email,punches,status,reward_available,joined_at')
      .eq('client_id', user.id),
    supabase
      .from('punches')
      .select('created_at')
      .eq('client_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString()),
  ]);

  const allMembers = members ?? [];
  const monthPunches = punches ?? [];
  const businessName = clientData?.business_name ?? 'Mon commerce';

  const totalMembers = allMembers.length;
  const activeMembers = allMembers.filter((m) => m.status === 'active').length;
  const rewardsReady = allMembers.filter((m) => m.reward_available).length;
  const newThisMonth = allMembers.filter(
    (m) => m.joined_at && new Date(m.joined_at) >= start
  ).length;

  const perDay: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) perDay[d] = 0;
  monthPunches.forEach((p) => {
    const day = new Date(p.created_at).getDate();
    perDay[day] = (perDay[day] || 0) + 1;
  });

  const monthLabel = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const pad = (n: number) => String(n).padStart(2, '0');

  // ─── Format CSV ─────────────────────────────────────────────────────────────
  if (format === 'csv') {
    const rows: string[] = [];
    rows.push([cell(`${businessName} — Statistiques`), cell(monthLabel)].join(','));
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
        cell(m.first_name), cell(m.last_name), cell(m.email),
        cell(m.punches), cell(m.status), cell(m.reward_available ? 'oui' : 'non'),
      ].join(','));
    });

    const csv = '﻿' + rows.join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="stats-${now.getFullYear()}-${pad(now.getMonth() + 1)}.csv"`,
      },
    });
  }

  // ─── Construction du classeur ──────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Fidely';
  wb.created = now;

  const ws = wb.addWorksheet('Statistiques', {
    views: [{ showGridLines: false }],
  });
  ws.columns = [
    { width: 28 }, { width: 16 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 18 },
  ];

  const sectionHeader = (row: ExcelJS.Row, label: string) => {
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE } };
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    }
    row.height = 22;
  };

  // Titre
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = `${businessName} — Statistiques`;
  title.font = { bold: true, size: 18, color: { argb: WHITE } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  ws.getRow(1).height = 34;

  ws.mergeCells('A2:F2');
  const sub = ws.getCell('A2');
  sub.value = `Mois de ${monthLabel}`;
  sub.font = { italic: true, size: 11, color: { argb: GREEN } };
  sub.alignment = { indent: 1 };
  ws.getRow(2).height = 20;

  ws.addRow([]);

  // Résumé
  sectionHeader(ws.addRow([]), 'Résumé du mois');
  const summary: [string, number][] = [
    ['Total membres', totalMembers],
    ['Cartes actives', activeMembers],
    ['Récompenses prêtes', rewardsReady],
    ['Tampons ce mois', monthPunches.length],
    ['Nouveaux membres ce mois', newThisMonth],
  ];
  summary.forEach(([label, value], i) => {
    const r = ws.addRow([label, value]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { horizontal: 'left' };
    if (i % 2 === 0) {
      for (let c = 1; c <= 2; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      }
    }
  });

  ws.addRow([]);

  // Détail par jour
  sectionHeader(ws.addRow([]), 'Détail par jour');
  const dayHead = ws.addRow(['Date', 'Tampons']);
  dayHead.eachCell((cell, col) => {
    if (col > 2) return;
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
    const r = ws.addRow([date, perDay[d]]);
    if (d % 2 === 0) {
      for (let c = 1; c <= 2; c++) {
        r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      }
    }
  }

  ws.addRow([]);

  // Membres
  sectionHeader(ws.addRow([]), 'Liste des membres');
  const memHead = ws.addRow(['Prénom', 'Nom', 'Courriel', 'Tampons', 'Statut', 'Récompense']);
  memHead.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  });
  allMembers.forEach((m, i) => {
    const r = ws.addRow([
      m.first_name,
      m.last_name,
      m.email,
      m.punches,
      m.status === 'active' ? 'Actif' : m.status,
      m.reward_available ? 'Prête' : '—',
    ]);
    if (i % 2 === 0) {
      r.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      });
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `stats-${now.getFullYear()}-${pad(now.getMonth() + 1)}.xlsx`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
