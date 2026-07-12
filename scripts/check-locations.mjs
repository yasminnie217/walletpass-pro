import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

const key = JSON.parse(readFileSync('service-account.json', 'utf-8'));
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';

const issuerId = '3388000000023148537';
const clientId = process.argv[2] || '1926591b-9221-425d-b19e-2c68b5f5d3b9';
const classId = `${issuerId}.client_${clientId.replace(/[^a-zA-Z0-9_]/g, '_')}`;

const pk = await importPKCS8(key.private_key, 'RS256');
const now = Math.floor(Date.now() / 1000);
const assertion = await new SignJWT({ iss: key.client_email, sub: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
  .sign(pk);

const tokRes = await fetch(TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
});
const { access_token } = await tokRes.json();

const res = await fetch(`${WALLET_API}/loyaltyClass/${encodeURIComponent(classId)}`, {
  headers: { Authorization: `Bearer ${access_token}` },
});
const cls = await res.json();

console.log('classId       :', classId);
console.log('reviewStatus  :', cls.reviewStatus);
console.log('locations     :', JSON.stringify(cls.locations ?? null));
