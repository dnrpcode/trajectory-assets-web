export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') ?? '';
  const range = url.searchParams.get('range') ?? '5y';
  const interval = url.searchParams.get('interval') ?? '1mo';

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
