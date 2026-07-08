import { SignJWT, importPKCS8 } from 'jose';
import { loadServiceAccountKey, getWalletConfig } from './google-wallet-credentials';

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

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
  memberId: string;
  memberName: string;
  points: number;
}

export interface UpdateObjectParams {
  points?: number;
  memberName?: string;
  state?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

// ─── JWT signing (RS256, via jose / WebCrypto — évite ERR_OSSL_UNSUPPORTED) ──

async function signJwt(payload: Record<string, unknown>, privateKeyPem: string): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
}

// ─── Auth (sans google-auth-library) ─────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const key = loadServiceAccountKey();
  const now = Math.floor(Date.now() / 1000);

  const assertion = await signJwt(
    {
      iss: key.client_email,
      sub: key.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    key.private_key
  );

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`[getAccessToken] ${data.error ?? res.status}`);
  }
  return data.access_token;
}

async function walletRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${WALLET_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`[walletRequest] ${method} ${path} → ${res.status}: ${text}`);
    (err as unknown as Record<string, unknown>).status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// ─── LoyaltyClass ────────────────────────────────────────────────────────────

export async function createLoyaltyClass(params: LoyaltyClassParams) {
  const loyaltyClass = {
    id: params.classId,
    programName: params.programName,
    issuerName: params.issuerName,
    programLogo: {
      sourceUri: { uri: params.logoUrl },
      contentDescription: {
        defaultValue: { language: 'fr-CA', value: `Logo ${params.programName}` },
      },
    },
    hexBackgroundColor: params.hexBackgroundColor,
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    accountIdLabel: 'Membre',
    accountNameLabel: 'Nom',
    loyaltyPoints: { label: 'Tampons' },
  };

  return walletRequest('POST', '/loyaltyClass', loyaltyClass);
}

export async function updateLoyaltyClass(
  classId: string,
  params: Partial<Omit<LoyaltyClassParams, 'classId'>>
) {
  const existing = await walletRequest<Record<string, unknown>>(
    'GET',
    `/loyaltyClass/${encodeURIComponent(classId)}`
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

  return walletRequest('PUT', `/loyaltyClass/${encodeURIComponent(classId)}`, updated);
}

// ─── LoyaltyObject ───────────────────────────────────────────────────────────

export async function createLoyaltyObject(params: LoyaltyObjectParams) {
  const loyaltyObject = {
    id: params.objectId,
    classId: params.classId,
    state: 'ACTIVE',
    accountId: params.memberId,
    accountName: params.memberName,
    loyaltyPoints: {
      label: 'Tampons',
      balance: { int: params.points },
    },
    barcode: {
      type: 'QR_CODE',
      value: params.memberId,
      alternateText: params.memberId,
    },
  };

  return walletRequest('POST', '/loyaltyObject', loyaltyObject);
}

export async function updateLoyaltyObject(objectId: string, data: UpdateObjectParams) {
  const patch: Record<string, unknown> = {};

  if (data.points !== undefined) {
    patch.loyaltyPoints = { label: 'Tampons', balance: { int: data.points } };
  }
  if (data.memberName !== undefined) patch.accountName = data.memberName;
  if (data.state !== undefined) patch.state = data.state;

  return walletRequest(
    'PATCH',
    `/loyaltyObject/${encodeURIComponent(objectId)}`,
    patch
  );
}

// ─── Save URL (JWT) ───────────────────────────────────────────────────────────

export async function generateSaveUrl(objectParams: LoyaltyObjectParams): Promise<string> {
  const key = loadServiceAccountKey();

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
    origins: ['walletpass-pro2.vercel.app', 'localhost:3000'],
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  const token = await signJwt(claims, key.private_key);
  return `https://pay.google.com/gp/v/save/${token}`;
}

// ─── Messages (notifications push) ───────────────────────────────────────────

export async function addMessageToObject(objectId: string, header: string, body: string) {
  return walletRequest(
    'POST',
    `/loyaltyObject/${encodeURIComponent(objectId)}/addMessage`,
    {
      message: {
        id: `msg_${Date.now()}`,
        header,
        body,
        messageType: 'TEXT',
      },
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildObjectId(memberId: string): string {
  const { issuerId } = getWalletConfig();
  const safe = memberId.replace(/[^a-zA-Z0-9_]/g, '_');
  return `${issuerId}.member_${safe}`;
}

export function buildClassId(clientId: string): string {
  const { issuerId } = getWalletConfig();
  const safe = clientId.replace(/[^a-zA-Z0-9_]/g, '_');
  return `${issuerId}.client_${safe}`;
}
