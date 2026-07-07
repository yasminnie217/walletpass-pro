import { updateLoyaltyClass } from '@/lib/google-wallet';

export async function PATCH(req: Request) {
  try {
    const body = await req.json() as {
      classId: string;
      programName?: string;
      issuerName?: string;
      logoUrl?: string;
      hexBackgroundColor?: string;
    };

    const { classId, ...params } = body;

    if (!classId) {
      return Response.json({ error: 'classId manquant' }, { status: 400 });
    }

    await updateLoyaltyClass(classId, params);

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data: unknown }; message?: string };
    console.error('[update-class]', e.response?.data ?? e.message);
    return Response.json(
      { error: 'Erreur mise à jour LoyaltyClass', detail: e.response?.data ?? e.message },
      { status: 500 }
    );
  }
}
