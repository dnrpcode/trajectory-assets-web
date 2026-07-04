export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://trajectory-assets.vercel.app';

const VALID_INTERVALS = new Set(['1m','5m','15m','30m','1h','1d','1wk','1mo']);
const VALID_RANGES    = new Set(['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max']);

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

  const symbol   = (url.searchParams.get('symbol') ?? '').trim().toUpperCase();
  const range    = url.searchParams.get('range')    ?? '5y';
  const interval = url.searchParams.get('interval') ?? '1mo';

  if (!symbol || symbol.length > 20 || !/^[A-Z0-9.^]+$/.test(symbol))
    return err('Invalid symbol', 400, origin);
  if (!VALID_RANGES.has(range))    return err('Invalid range', 400, origin);
  if (!VALID_INTERVALS.has(interval)) return err('Invalid interval', 400, origin);

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), 'Cache-Control': 'public, s-maxage=3600' },
  });
}
