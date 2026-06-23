export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://trajectory-assets.vercel.app';

function corsHeaders(origin: string) {
  const allowed = origin === ALLOWED_ORIGIN || origin.endsWith('.vercel.app') ? origin : ALLOWED_ORIGIN;
  return { 'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin' };
}

function err(msg: string, status: number, origin: string): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin') ?? '';
  const url    = new URL(req.url);
  const q      = (url.searchParams.get('q') ?? '').trim().toUpperCase();

  if (!q || q.length > 15) return err('Invalid query', 400, origin);
  if (!/^[A-Z0-9.]+$/.test(q)) return err('Invalid query characters', 400, origin);

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=8&quotesCount=0`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), 'Cache-Control': 'public, s-maxage=1800' },
  });
}
