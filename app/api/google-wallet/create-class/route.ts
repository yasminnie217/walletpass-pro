import { createClient } from '@supabase/supabase-js';
import { createLoyaltyClass, buildClassId } from '@/lib/google-wallet';

// Image de secours publique si le commerçant n'a pas encore de logo hébergé
const FALLBACK_LOGO =
  'https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  let clientId: string | undefined;

  try {
    ({ clientId } = await req.json());
    if (!clientId) {
      return Response.json({ error: 'clientId manquant' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: client, error } = await supabase
      .from('clients')
      .select('id,business_name,organization_name,card_name,logo_url,primary_color')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return Response.json({ error: 'Client introuvable' }, { status: 404 });
    }

    const classId = buildClassId(clientId);

    await createLoyaltyClass({
      classId,
      programName: client.card_name || client.business_name || 'Carte Fidélité',
      issuerName: client.organization_name || client.business_name || 'WalletPass Pro',
      logoUrl: client.logo_url || FALLBACK_LOGO,
      hexBackgroundColor: client.primary_color || '#00704A',
    });

    // Stocke le classId dans le profil commerçant
    await supabase
      .from('clients')
      .update({ google_wallet_class_id: classId })
      .eq('id', clientId);

    return Response.json({ classId });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };

    // 409 = classe déjà existante → idempotent, on met quand même à jour la colonne
    if (e.response?.status === 409 && clientId) {
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
