export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://trajectory-assets.vercel.app';

function corsHeaders(origin: string) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
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
  const ticker = (url.searchParams.get('ticker') ?? '').trim().toUpperCase();

  if (!ticker || ticker.length > 15) return err('Invalid ticker', 400, origin);
  if (!/^[A-Z0-9.]+$/.test(ticker))  return err('Invalid ticker format', 400, origin);

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends&corsDomain=finance.yahoo.com`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), 'Cache-Control': 'public, s-maxage=300' },
  });
}
