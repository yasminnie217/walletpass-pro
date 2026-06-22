import { createSign } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import { loadServiceAccountKey, getWalletConfig } from './google-wallet-credentials';

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPES = ['https://www.googleapis.com/auth/wallet_object.issuer'];

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getAuthClient(): GoogleAuth {
  const key = loadServiceAccountKey();
  return new GoogleAuth({
    credentials: key,
    scopes: SCOPES,
  });
}

async function request<T>(
  auth: GoogleAuth,
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const client = await auth.getClient();
  const res = await client.request<T>({ url, method, data: body });
  return res.data;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoyaltyClassParams {
  classId: string;
  programName: string;
  issuerName: string;
  logoUrl: string;
  hexBackgroundColor: string;
}

export interface LoyaltyObjectParams {
  objectId: string;
  classId: string;
  memberId: string;       // encodé dans le QR — utilisé par le scanner
  memberName: string;
  points: number;
}

export interface UpdateObjectParams {
  points?: number;
  memberName?: string;
  state?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

// ─── LoyaltyClass ────────────────────────────────────────────────────────────

/**
 * Crée une LoyaltyClass pour un commerçant.
 * reviewStatus = UNDER_REVIEW : la classe est utilisable immédiatement pour les tests ;
 * Google la marque APPROVED après modération (pas bloquant en sandbox).
 */
export async function createLoyaltyClass(params: LoyaltyClassParams) {
  const auth = getAuthClient();

  const loyaltyClass = {
    id: params.classId,
    programName: params.programName,
    issuerName: params.issuerName,
    programLogo: {
      sourceUri: {
        uri: params.logoUrl,
      },
      contentDescription: {
        defaultValue: { language: 'fr-CA', value: `Logo ${params.programName}` },
      },
    },
    hexBackgroundColor: params.hexBackgroundColor,
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    accountIdLabel: 'Membre',
    accountNameLabel: 'Nom',
    loyaltyPoints: {
      label: 'Tampons',
    },
  };

  return request(auth, 'POST', `${WALLET_API}/loyaltyClass`, loyaltyClass);
}

/**
 * Met à jour la LoyaltyClass d'un commerçant (nom, logo, couleur, description).
 * Utilise PUT (remplacement complet) — le PATCH partiel requiert une liste de
 * champs qui varie selon la version de l'API.
 */
export async function updateLoyaltyClass(
  classId: string,
  params: Partial<Omit<LoyaltyClassParams, 'classId'>>
) {
  const auth = getAuthClient();

  // Récupère la classe existante pour ne pas écraser les champs non fournis
  const existing = await request<Record<string, unknown>>(
    auth,
    'GET',
    `${WALLET_API}/loyaltyClass/${encodeURIComponent(classId)}`
  );

  const updated = {
    ...existing,
    ...(params.programName && { programName: params.programName }),
    ...(params.issuerName && { issuerName: params.issuerName }),
    ...(params.hexBackgroundColor && { hexBackgroundColor: params.hexBackgroundColor }),
    ...(params.logoUrl && {
      programLogo: {
        sourceUri: { uri: params.logoUrl },
        contentDescription: {
          defaultValue: { language: 'fr-CA', value: `Logo ${params.programName ?? ''}` },
        },
      },
    }),
  };

  return request(
    auth,
    'PUT',
    `${WALLET_API}/loyaltyClass/${encodeURIComponent(classId)}`,
    updated
  );
}

// ─── LoyaltyObject ───────────────────────────────────────────────────────────

/**
 * Crée un LoyaltyObject (carte d'un membre).
 * Le QR code encode memberId — c'est ce que le scanner du commerçant lit
 * pour identifier le bon membre et lui ajouter un tampon.
 */
export async function createLoyaltyObject(params: LoyaltyObjectParams) {
  const auth = getAuthClient();

  const loyaltyObject = {
    id: params.objectId,
    classId: params.classId,
    state: 'ACTIVE',
    accountId: params.memberId,
    accountName: params.memberName,
    loyaltyPoints: {
      label: 'Tampons',
      balance: {
        int: params.points,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: params.memberId,
      alternateText: params.memberId,
    },
  };

  return request(auth, 'POST', `${WALLET_API}/loyaltyObject`, loyaltyObject);
}

/**
 * Met à jour un LoyaltyObject existant (points, état).
 * La carte sur l'appareil de l'utilisateur se met à jour automatiquement
 * via les Push Update de Google Wallet.
 */
export async function updateLoyaltyObject(objectId: string, data: UpdateObjectParams) {
  const auth = getAuthClient();

  const patch: Record<string, unknown> = {};

  if (data.points !== undefined) {
    patch.loyaltyPoints = {
      label: 'Tampons',
      balance: { int: data.points },
    };
  }
  if (data.memberName !== undefined) {
    patch.accountName = data.memberName;
  }
  if (data.state !== undefined) {
    patch.state = data.state;
  }

  return request(
    auth,
    'PATCH',
    `${WALLET_API}/loyaltyObject/${encodeURIComponent(objectId)}`,
    patch
  );
}

// ─── Save URL (JWT) ───────────────────────────────────────────────────────────

/**
 * Génère le lien "Enregistrer dans Google Wallet" pour un objet donné.
 *
 * Le JWT est signé RS256 avec la clé du compte de service.
 * Le payload référence l'objet complet (nouvelle émission) OU uniquement
 * son ID si l'objet existe déjà côté Google Wallet.
 *
 * On passe l'objet complet pour garantir la création si elle n'a pas encore eu
 * lieu (idempotent — Google Wallet rejette un doublon sans erreur fatale).
 */
export async function generateSaveUrl(objectParams: LoyaltyObjectParams): Promise<string> {
  const key = loadServiceAccountKey();
  const { issuerId } = getWalletConfig();

  // Reconstruit l'objet pour le payload JWT (même structure que createLoyaltyObject)
  const loyaltyObject = {
    id: objectParams.objectId,
    classId: objectParams.classId,
    state: 'ACTIVE',
    accountId: objectParams.memberId,
    accountName: objectParams.memberName,
    loyaltyPoints: {
      label: 'Tampons',
      balance: { int: objectParams.points },
    },
    barcode: {
      type: 'QR_CODE',
      value: objectParams.memberId,
      alternateText: objectParams.memberId,
    },
  };

  const claims = {
    iss: key.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [
      // On autorise les origines connues — à étendre si domaine custom
      'walletpass-pro.vercel.app',
      'localhost:3000',
    ],
    payload: {
      loyaltyObjects: [loyaltyObject],
    },
  };

  // Signe le JWT avec la clé privée du compte de service (RS256, crypto natif Node)
  const token = signJwt(claims, key.private_key);
  return `https://pay.google.com/gp/v/save/${token}`;
}

// ─── JWT signing (RS256, crypto natif) ───────────────────────────────────────

function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function signJwt(payload: unknown, privateKey: string): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const sig = b64url(signer.sign(privateKey));
  return `${signingInput}.${sig}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construit l'objectId Google Wallet pour un membre donné.
 * Format : {issuerId}.{memberId_sanitisé}
 * Les caractères non-alphanumériques sont remplacés par _ (contrainte GW).
 */
export function buildObjectId(memberId: string): string {
  const { issuerId } = getWalletConfig();
  const safe = memberId.replace(/[^a-zA-Z0-9_]/g, '_');
  return `${issuerId}.member_${safe}`;
}

/**
 * Construit le classId Google Wallet pour un commerçant donné.
 * Format : {issuerId}.client_{clientId_sanitisé}
 */
export function buildClassId(clientId: string): string {
  const { issuerId } = getWalletConfig();
  const safe = clientId.replace(/[^a-zA-Z0-9_]/g, '_');
  return `${issuerId}.client_${safe}`;
}
