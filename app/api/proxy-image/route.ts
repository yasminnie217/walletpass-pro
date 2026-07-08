export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url || !url.startsWith('https://')) {
    return new Response('url invalide', { status: 400 });
  }
  const res = await fetch(url);
  if (!res.ok) return new Response('not found', { status: 404 });
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? 'image/png';
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
