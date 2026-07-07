/**
 * Smoke test Google Wallet — script jetable, NE PAS commiter.
 * Usage : node scripts/smoke-test-wallet.cjs
 */
const { createSign } = require('crypto');
const { readFileSync } = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

// ─── Config ──────────────────────────────────────────────────────────────────

const ISSUER_ID   = '3388000000023148537';
const CLASS_SUFFIX = 'test_smoke';
const CLASS_ID    = `${ISSUER_ID}.${CLASS_SUFFIX}`;
const OBJECT_ID   = `${ISSUER_ID}.member_smoke_001`;
const MEMBER_ID   = 'smoke-001';
const WALLET_API  = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPES      = ['https://www.googleapis.com/auth/wallet_object.issuer'];

// ─── Credentials ─────────────────────────────────────────────────────────────

const key = JSON.parse(
  readFileSync(path.join(process.cwd(), 'service-account.json'), 'utf-8')
);

const auth = new GoogleAuth({ credentials: key, scopes: SCOPES });

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function api(method, endpoint, body) {
  const client = await auth.getClient();
  try {
    const res = await client.request({
      url: `${WALLET_API}${endpoint}`,
      method,
      data: body,
    });
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    const status = err.response?.status;
    const data   = err.response?.data;
    return { ok: false, status, data };
  }
}

// ─── JWT RS256 ────────────────────────────────────────────────────────────────

function b64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function signJwt(payload, privateKey) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body   = b64url(JSON.stringify(payload));
  const si     = `${header}.${body}`;
  const signer = createSign('RSA-SHA256');
  signer.update(si);
  return `${si}.${b64url(signer.sign(privateKey))}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('──────────────────────────────────────────────');
  console.log('  Google Wallet Smoke Test');
  console.log('──────────────────────────────────────────────\n');

  // 1. Créer la LoyaltyClass
  console.log('1️⃣  createLoyaltyClass →', CLASS_ID);
  const classBody = {
    id: CLASS_ID,
    programName: 'Test WalletPass',
    issuerName: 'WalletPass Pro',
    programLogo: {
      sourceUri: { uri: 'https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg' },
      contentDescription: { defaultValue: { language: 'fr-CA', value: 'Logo Test WalletPass' } },
    },
    hexBackgroundColor: '#00704A',
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    accountIdLabel: 'Membre',
    accountNameLabel: 'Nom',
    loyaltyPoints: { label: 'Tampons' },
  };

  let classResult = await api('POST', '/loyaltyClass', classBody);
  if (!classResult.ok) {
    if (classResult.status === 409) {
      console.log('   ℹ️  Classe déjà existante (409) — on continue.');
    } else {
      console.error(`   ❌ Erreur ${classResult.status}:`);
      console.error(JSON.stringify(classResult.data, null, 2));
      process.exit(1);
    }
  } else {
    console.log(`   ✅ Classe créée (${classResult.status})`);
  }

  // 2. Créer le LoyaltyObject
  console.log('\n2️⃣  createLoyaltyObject →', OBJECT_ID);
  const objectBody = {
    id: OBJECT_ID,
    classId: CLASS_ID,
    state: 'ACTIVE',
    accountId: MEMBER_ID,
    accountName: 'Marie Tremblay (smoke)',
    loyaltyPoints: {
      label: 'Tampons',
      balance: { int: 3 },
    },
    barcode: {
      type: 'QR_CODE',
      value: MEMBER_ID,
      alternateText: MEMBER_ID,
    },
  };

  let objectResult = await api('POST', '/loyaltyObject', objectBody);
  if (!objectResult.ok) {
    if (objectResult.status === 409) {
      console.log('   ℹ️  Objet déjà existant (409) — on continue.');
    } else {
      console.error(`   ❌ Erreur ${objectResult.status}:`);
      console.error(JSON.stringify(objectResult.data, null, 2));
      process.exit(1);
    }
  } else {
    console.log(`   ✅ Objet créé (${objectResult.status})`);
  }

  // 3. Générer le lien Save
  console.log('\n3️⃣  generateSaveUrl');
  const claims = {
    iss: key.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: ['walletpass-pro.vercel.app', 'localhost:3000'],
    payload: {
      loyaltyObjects: [objectBody],
    },
  };

  const token   = signJwt(claims, key.private_key);
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  console.log(`   ✅ JWT généré — ${token.length} chars (limite 1800)\n`);
  console.log('──────────────────────────────────────────────');
  console.log('  🔗 URL Save to Google Wallet :');
  console.log('──────────────────────────────────────────────');
  console.log(saveUrl);
  console.log('──────────────────────────────────────────────\n');
  console.log('Scanne ce QR ou ouvre ce lien sur Android pour tester l\'ajout dans Google Wallet.');
}

main().catch(err => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
