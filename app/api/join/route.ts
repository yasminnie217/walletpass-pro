import { createClient } from '@supabase/supabase-js';
import { createLoyaltyObject, generateSaveUrl, buildObjectId } from '@/lib/google-wallet';
import { planStatus, FREE_MEMBER_CAP } from '@/src/lib/plan';

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

    // Récupère la LoyaltyClass du commerçant
    const { data: clientRow } = await supabase
      .from('clients')
      .select('google_wallet_class_id,card_name,organization_name,business_name,total_stamps,plan,trial_ends_at')
      .eq('id', clientId)
      .single();

    // Plan gratuit : plafond de membres
    if (!planStatus(clientRow).hasAccess) {
      const { count } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);
      if ((count ?? 0) >= FREE_MEMBER_CAP) {
        return Response.json(
          { error: 'Ce programme de fidélité a atteint sa capacité. Contactez le commerce.' },
          { status: 403 }
        );
      }
    }

    // Membre déjà inscrit → on ne recrée rien, on renvoie sa carte pour qu'il puisse
    // réactiver ses notifications et récupérer son bouton Wallet.
    const { data: existing } = await supabase
      .from('members')
      .select('id,first_name,last_name,punches,google_wallet_object_id')
      .eq('client_id', clientId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      let saveUrl: string | null = null;
      const classId = clientRow?.google_wallet_class_id;
      if (classId) {
        try {
          const objectId = existing.google_wallet_object_id ?? buildObjectId(existing.id);
          saveUrl = await generateSaveUrl({
            objectId,
            classId,
            memberId: existing.id,
            memberName: `${existing.first_name} ${existing.last_name}`,
            points: existing.punches ?? 0,
            totalStamps: clientRow?.total_stamps ?? undefined,
          });
        } catch (gwErr) {
          console.error('[join] regénération saveUrl (existant) échouée:', gwErr);
        }
      }
      return Response.json({ member: existing, saveUrl, alreadyRegistered: true });
    }

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

        const params = { objectId, classId, memberId: member.id, memberName, points: 0, totalStamps: clientRow?.total_stamps ?? undefined };
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
