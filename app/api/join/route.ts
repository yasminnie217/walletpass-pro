import { createClient } from '@supabase/supabase-js';
import { createLoyaltyObject, generateSaveUrl, buildObjectId } from '@/lib/google-wallet';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { clientId, first_name, last_name, email, email_consent } =
      await req.json() as {
        clientId: string;
        first_name: string;
        last_name: string;
        email: string;
        email_consent?: boolean;
      };

    if (!clientId || !first_name || !last_name || !email) {
      return Response.json({ error: 'Champs manquants.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifie doublon
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('client_id', clientId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: 'Ce courriel est déjà inscrit.' }, { status: 409 });
    }

    // Récupère la LoyaltyClass du commerçant
    const { data: clientRow } = await supabase
      .from('clients')
      .select('google_wallet_class_id,card_name,organization_name,business_name')
      .eq('id', clientId)
      .single();

    // Insère le membre avec consentement
    const consentedAt = email_consent ? new Date().toISOString() : null;

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        client_id: clientId,
        first_name,
        last_name,
        email,
        punches: 0,
        status: 'active',
        email_consent: email_consent ?? false,
        email_consent_at: consentedAt,
      })
      .select()
      .single();

    if (error) throw error;

    // Crée l'objet Google Wallet et génère le lien Save
    let saveUrl: string | null = null;
    let googleWalletObjectId: string | null = null;

    const classId = clientRow?.google_wallet_class_id;
    if (classId) {
      try {
        const objectId = buildObjectId(member.id);
        const memberName = `${first_name} ${last_name}`;

        const params = { objectId, classId, memberId: member.id, memberName, points: 0 };
        await createLoyaltyObject(params);
        saveUrl = await generateSaveUrl(params);
        googleWalletObjectId = objectId;

        await supabase
          .from('members')
          .update({ google_wallet_object_id: googleWalletObjectId })
          .eq('id', member.id);
      } catch (gwErr) {
        // Non-bloquant : l'inscription réussit même si GW échoue
        console.error('[join] Google Wallet error (non-blocking):', gwErr);
      }
    } else {
      console.warn('[join] Pas de google_wallet_class_id pour ce client — carte GW non créée');
    }

    return Response.json({ member, saveUrl });
  } catch (err) {
    console.error('[join API]', err);
    return Response.json({ error: 'Une erreur est survenue. Réessayez.' }, { status: 500 });
  }
}
