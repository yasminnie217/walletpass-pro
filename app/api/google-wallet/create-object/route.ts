import { createClient } from '@supabase/supabase-js';
import { createLoyaltyObject, generateSaveUrl, buildObjectId } from '@/lib/google-wallet';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  let memberId: string | undefined;

  try {
    const body = await req.json();
    memberId = body.memberId as string;
    const { classId, memberName, points = 0 } = body as {
      classId: string;
      memberName: string;
      points?: number;
    };

    if (!memberId || !classId || !memberName) {
      return Response.json({ error: 'memberId, classId et memberName sont requis' }, { status: 400 });
    }

    const objectId = buildObjectId(memberId);

    const params = { objectId, classId, memberId, memberName, points };

    await createLoyaltyObject(params);
    const saveUrl = await generateSaveUrl(params);

    // Stocke l'objectId sur le membre
    const supabase = getSupabase();
    await supabase
      .from('members')
      .update({ google_wallet_object_id: objectId })
      .eq('id', memberId);

    return Response.json({ objectId, saveUrl });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };

    // 409 = objet déjà existant → génère quand même le lien Save
    if (e.response?.status === 409 && memberId) {
      const supabase = getSupabase();
      const { data: member } = await supabase
        .from('members')
        .select('id,first_name,last_name,punches,client_id')
        .eq('id', memberId)
        .single();

      const { data: client } = await supabase
        .from('clients')
        .select('google_wallet_class_id')
        .eq('id', member?.client_id)
        .single();

      if (member && client?.google_wallet_class_id) {
        const objectId = buildObjectId(memberId);
        const saveUrl = await generateSaveUrl({
          objectId,
          classId: client.google_wallet_class_id,
          memberId,
          memberName: `${member.first_name} ${member.last_name}`,
          points: member.punches ?? 0,
        });
        return Response.json({ objectId, saveUrl, alreadyExists: true });
      }
    }

    console.error('[create-object]', e.response?.data ?? e.message);
    return Response.json(
      { error: 'Erreur création LoyaltyObject', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
