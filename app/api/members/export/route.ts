import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/src/lib/supabase-server';
import { clientHasAccess } from '@/src/lib/plan-server';
import ExcelJS from 'exceljs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const GREEN = 'FF00704A';
const GOLD = 'FFCBA258';
const LIGHT = 'FFF1EDE4';
const WHITE = 'FFFFFFFF';

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';

  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return new Response('Non authentifié', { status: 401 });

  const supabase = getSupabase();
  if (!(await clientHasAccess(supabase, user.id))) {
    return new Response('Fonction réservée au plan Pro', { status: 403 });
  }
  const [{ data: clientData }, { data: members }] = await Promise.all([
    supabase.from('clients').select('business_name').eq('id', user.id).single(),
    supabase
      .from('members')
      .select('first_name,last_name,email,punches,status,reward_available,joined_at')
      .eq('client_id', user.id)
      .order('joined_at', { ascending: false }),
  ]);

  const allMembers = members ?? [];
  const businessName = clientData?.business_name ?? 'Mon commerce';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const fmtDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // ─── CSV ────────────────────────────────────────────────────────────────────
  if (format === 'csv') {
    const rows: string[] = [];
    rows.push([cell('Prénom'), cell('Nom'), cell('Courriel'), cell('Tampons'), cell('Statut'), cell('Récompense prête'), cell('Inscription')].join(','));
    allMembers.forEach((m) => {
      rows.push([
        cell(m.first_name), cell(m.last_name), cell(m.email), cell(m.punches),
        cell(m.status === 'active' ? 'Actif' : m.status),
        cell(m.reward_available ? 'oui' : 'non'),
        cell(fmtDate(m.joined_at)),
      ].join(','));
    });
    const csv = '﻿' + rows.join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="membres-${dateStr}.csv"`,
      },
    });
  }

  // ─── Excel ──────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Fidely';
  wb.created = now;
  const ws = wb.addWorksheet('Membres', { views: [{ showGridLines: false }] });
  ws.columns = [
    { width: 18 }, { width: 18 }, { width: 30 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 16 },
  ];

  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = `${businessName} — Liste des membres`;
  title.font = { bold: true, size: 18, color: { argb: WHITE } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  ws.getRow(1).height = 34;

  ws.mergeCells('A2:G2');
  const sub = ws.getCell('A2');
  sub.value = `${allMembers.length} membre${allMembers.length !== 1 ? 's' : ''} — exporté le ${fmtDate(now.toISOString())}`;
  sub.font = { italic: true, size: 11, color: { argb: GREEN } };
  sub.alignment = { indent: 1 };
  ws.getRow(2).height = 20;

  ws.addRow([]);

  const head = ws.addRow(['Prénom', 'Nom', 'Courriel', 'Tampons', 'Statut', 'Récompense', 'Inscription']);
  head.eachCell((cellObj) => {
    cellObj.font = { bold: true, color: { argb: WHITE } };
    cellObj.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
  });

  allMembers.forEach((m, i) => {
    const r = ws.addRow([
      m.first_name,
      m.last_name,
      m.email,
      m.punches,
      m.status === 'active' ? 'Actif' : m.status,
      m.reward_available ? 'Prête' : '—',
      fmtDate(m.joined_at),
    ]);
    if (i % 2 === 0) {
      r.eachCell((cellObj) => {
        cellObj.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      });
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="membres-${dateStr}.xlsx"`,
    },
  });
}
