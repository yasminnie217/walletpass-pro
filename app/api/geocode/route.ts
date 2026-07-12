// Recherche d'adresse gratuite via OpenStreetMap (Nominatim).
// Passe par le serveur pour envoyer un User-Agent conforme à leur politique d'usage.

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return Response.json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WalletPassPro/1.0 (support@walletpass-pro2.vercel.app)',
        'Accept-Language': 'fr',
      },
    });
    if (!res.ok) return Response.json([]);

    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const results = data.map((d) => ({
      latitude: Number(parseFloat(d.lat).toFixed(6)),
      longitude: Number(parseFloat(d.lon).toFixed(6)),
      address: d.display_name,
    }));
    return Response.json(results);
  } catch {
    return Response.json([]);
  }
}
