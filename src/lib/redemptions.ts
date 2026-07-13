/** Enregistre l'utilisation d'une récompense dans l'historique (non-bloquant). */
export async function recordRedemption(
  memberId: string,
  _clientId: string,
  rewardDescription?: string | null
) {
  try {
    await fetch('/api/redemptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, rewardDescription }),
    });
  } catch (err) {
    console.error('[recordRedemption]', err);
  }
}
