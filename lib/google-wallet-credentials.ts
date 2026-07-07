import { readFileSync } from 'fs';
import path from 'path';

export interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  [key: string]: unknown;
}

/**
 * Charge les credentials du compte de service Google Wallet.
 *
 * - Dev  : lit ./service-account.json depuis la racine du projet.
 * - Prod : décode GOOGLE_WALLET_SA_KEY_B64 (base64 → JSON).
 *
 * Lève une erreur explicite si aucune source n'est disponible.
 */
export function loadServiceAccountKey(): ServiceAccountKey {
  const b64 = process.env.GOOGLE_WALLET_SA_KEY_B64;

  if (b64 && b64.trim() !== '') {
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(json) as ServiceAccountKey;
  }

  // Fallback dev : lecture directe du fichier
  const keyPath = path.join(process.cwd(), 'service-account.json');
  try {
    const raw = readFileSync(keyPath, 'utf-8');
    return JSON.parse(raw) as ServiceAccountKey;
  } catch {
    throw new Error(
      '[Google Wallet] Credentials introuvables. ' +
        'En dev : déposez service-account.json à la racine. ' +
        'En prod : définissez GOOGLE_WALLET_SA_KEY_B64 dans les variables Vercel.'
    );
  }
}

export function getWalletConfig() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const classSuffix = process.env.GOOGLE_WALLET_CLASS_SUFFIX;

  if (!issuerId || !classSuffix) {
    throw new Error(
      '[Google Wallet] Variables manquantes : GOOGLE_WALLET_ISSUER_ID et/ou GOOGLE_WALLET_CLASS_SUFFIX.'
    );
  }

  return {
    issuerId,
    classSuffix,
    classId: `${issuerId}.${classSuffix}`,
  };
}
