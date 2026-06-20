export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ticker = url.searchParams.get('ticker') ?? '';

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends&corsDomain=finance.yahoo.com`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}
