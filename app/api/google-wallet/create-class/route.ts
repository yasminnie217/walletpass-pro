import { createClient } from '@supabase/supabase-js';
import { createLoyaltyClass, buildClassId } from '@/lib/google-wallet';
import { createSupabaseServer } from '@/src/lib/supabase-server';

const FALLBACK_LOGO = 'https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg';

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

  const clientId = user.id; // Toujours l'utilisateur authentifié, jamais le body

  try {
    await req.json().catch(() => {}); // Consomme le body sans l'utiliser

    const supabase = getSupabase();

    const { data: client, error } = await supabase
      .from('clients')
      .select('id,business_name,organization_name,card_name,logo_url,primary_color,latitude,longitude')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return Response.json({ error: 'Client introuvable' }, { status: 404 });
    }

    const classId = buildClassId(clientId);

    const locations = client.latitude != null && client.longitude != null
      ? [{ latitude: client.latitude, longitude: client.longitude }]
      : undefined;

    await createLoyaltyClass({
      classId,
      programName: client.card_name || client.business_name || 'Carte Fidélité',
      issuerName: client.organization_name || client.business_name || 'Fidely',
      logoUrl: client.logo_url || FALLBACK_LOGO,
      hexBackgroundColor: client.primary_color || '#00704A',
      locations,
    });

    await supabase
      .from('clients')
      .update({ google_wallet_class_id: classId })
      .eq('id', clientId);

    return Response.json({ classId });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };

    const status = e.response?.status ?? (e as unknown as Record<string, unknown>).status;
    if (status === 409) {
      const classId = buildClassId(clientId);
      const supabase = getSupabase();
      await supabase
        .from('clients')
        .update({ google_wallet_class_id: classId })
        .eq('id', clientId);
      return Response.json({ classId, alreadyExists: true });
    }

    console.error('[create-class]', e.response?.data ?? e.message);
    return Response.json(
      { error: 'Erreur création LoyaltyClass', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
