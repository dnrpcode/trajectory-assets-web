export const config = { runtime: 'edge' };

// Flexible field extractor — IDX uses inconsistent field casing across endpoints
function pick(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return Number(v);
  }
  return 0;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ticker = (url.searchParams.get('ticker') ?? '').toUpperCase().trim();

  if (!ticker) {
    return new Response(JSON.stringify({ error: 'ticker required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const idxUrl = `https://idx.co.id/umbraco/Surface/StockData/GetStocksSnapshot?start=0&length=1&code=${encodeURIComponent(ticker)}&language=id-id`;

  const res = await fetch(idxUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      'Referer': 'https://idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham/',
      'Origin': 'https://idx.co.id',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `IDX returned ${res.status}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const json = await res.json() as { data?: Record<string, unknown>[] };
  const item = json.data?.[0];

  if (!item) {
    return new Response(JSON.stringify({ error: 'No data for ticker' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const foreignBuy  = pick(item, ['ForeignBuy',  'foreignBuy',  'FOREIGN_BUY',  'foreign_buy']);
  const foreignSell = pick(item, ['ForeignSell', 'foreignSell', 'FOREIGN_SELL', 'foreign_sell']);
  const totalValue  = pick(item, ['Value', 'value', 'VALUE']);
  const lastPrice   = pick(item, ['LastPrice', 'ClosePrice', 'lastPrice', 'closePrice', 'Close', 'close']);
  const change      = pick(item, ['Change', 'change', 'CHANGE']);
  const volume      = pick(item, ['Volume', 'volume', 'VOLUME']);
  const dateClose   = String(item['DateClose'] ?? item['dateClose'] ?? item['DATE_CLOSE'] ?? '');

  // Domestic = total minus foreign (standard IDX calculation)
  const domesticBuy  = Math.max(0, totalValue - foreignBuy);
  const domesticSell = Math.max(0, totalValue - foreignSell);

  const result = {
    ticker,
    date: dateClose || new Date().toISOString().split('T')[0],
    foreign:  { buy: foreignBuy,  sell: foreignSell,  net: foreignBuy  - foreignSell  },
    domestic: { buy: domesticBuy, sell: domesticSell, net: domesticBuy - domesticSell },
    total: totalValue,
    lastPrice,
    change,
    volume,
  };

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
    },
  });
}
