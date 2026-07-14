import { useClient } from './useClient';
import { planStatus } from '../lib/plan';

/** Statut d'abonnement du commerçant connecté (dérivé de sa ligne clients). */
export function usePlan() {
  const { client } = useClient();
  return { ...planStatus(client), client };
}
