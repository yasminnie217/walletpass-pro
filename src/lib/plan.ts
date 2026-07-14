// Logique d'abonnement partagée (client + serveur).

export const FREE_MEMBER_CAP = 25;
export const TRIAL_DAYS = 14;
export const PRO_PRICE = '29 $/mois';

interface PlanFields {
  plan?: string | null;
  trial_ends_at?: string | null;
}

export interface PlanStatus {
  isPro: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  hasAccess: boolean; // Pro OU essai encore actif
}

export function planStatus(client: PlanFields | null | undefined): PlanStatus {
  const isPro = client?.plan === 'pro';
  let isTrialing = false;
  let trialDaysLeft = 0;

  if (!isPro && client?.trial_ends_at) {
    const end = new Date(client.trial_ends_at).getTime();
    const now = Date.now();
    if (end > now) {
      isTrialing = true;
      trialDaysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    }
  }

  return { isPro, isTrialing, trialDaysLeft, hasAccess: isPro || isTrialing };
}
