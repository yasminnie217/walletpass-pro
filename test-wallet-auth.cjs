const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function testWalletAuth() {
  const issuerId = '3388000000023148537';
  const keyFile = path.join(__dirname, 'service-account.json');

  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  let client;
  try {
    client = await auth.getClient();
  } catch (err) {
    console.error('❌ Erreur chargement clé JSON :', err.message);
    process.exit(1);
  }

  const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass?issuerId=${issuerId}`;

  let res;
  try {
    res = await client.request({ url });
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 403) {
      console.error(`❌ 403 Forbidden — compte de service non autorisé sur l'Issuer.`);
      console.error('Vérifiez : Google Wallet Console → Business → Users → rôle Developer attribué.');
    } else if (status === 401) {
      console.error('❌ 401 Unauthorized — clé JSON invalide ou expirée.');
    } else {
      console.error(`❌ Erreur HTTP ${status ?? 'inconnue'}`);
    }
    if (data) console.error('Détail JSON :', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const classes = res.data.resources ?? [];
  console.log('✅ Auth OK — compte de service autorisé');
  console.log(`   Loyalty classes existantes : ${classes.length}`);
}

testWalletAuth();
