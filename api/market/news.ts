export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=8&quotesCount=0`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=1800',
    },
  });
}
