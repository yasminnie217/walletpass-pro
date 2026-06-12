const PASS2U_BASE = 'https://www.pass2u.net/v2';
const API_KEY = import.meta.env.VITE_PASS2U_API_KEY;
const MODEL_ID = import.meta.env.VITE_PASS2U_MODEL_ID;

const headers = {
  'X-API-KEY': API_KEY,
  'Content-Type': 'application/json',
};

export async function createPass(name: string, email: string) {
  const res = await fetch(
    `${PASS2U_BASE}/models/${MODEL_ID}/passes`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, email }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur Pass2U');
  return data;
}

export async function addPunch(passId: string) {
  const res = await fetch(
    `${PASS2U_BASE}/models/${MODEL_ID}/passes/${passId}/checkout`,
    { method: 'POST', headers }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur Pass2U');
  return data;
}

export async function sendPushNotification(title: string, message: string) {
  const res = await fetch(
    `${PASS2U_BASE}/models/${MODEL_ID}/push`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, message }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur Pass2U');
  return data;
}

export async function updateModel(updates: { name?: string; description?: string }) {
  const res = await fetch(
    `${PASS2U_BASE}/models/${MODEL_ID}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur Pass2U');
  return data;
}
