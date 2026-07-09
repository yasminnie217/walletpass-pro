import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/src/lib/supabase-server';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return Response.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${user.id}/logo.${ext}`; // Toujours dans le dossier de l'utilisateur authentifié
    const bytes = await file.arrayBuffer();

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from('logos')
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('logos').getPublicUrl(path);
    // Paramètre anti-cache : force le navigateur et Google Wallet à recharger
    // la nouvelle image même si le nom de fichier est identique.
    const url = `${data.publicUrl}?v=${Date.now()}`;
    return Response.json({ url });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[upload-logo]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
