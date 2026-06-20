const BASE = 'https://api.coingecko.com/api/v3';

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

export interface OHLCPoint {
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const CoinGeckoService = {
  async getMarkets(ids: string[]): Promise<CoinMarket[]> {
    if (ids.length === 0) return [];
    return get<CoinMarket[]>('/coins/markets', {
      vs_currency: 'usd',
      ids: ids.join(','),
      order: 'market_cap_desc',
      per_page: '50',
      page: '1',
      sparkline: 'false',
    });
  },

  async getOHLC(coinId: string, days: 30 | 14 | 7 = 30): Promise<OHLCPoint[]> {
    const raw = await get<[number, number, number, number, number][]>(
      `/coins/${coinId}/ohlc`,
      { vs_currency: 'usd', days: String(days) },
    );
    return raw.map(([time, open, high, low, close]) => ({ time, open, high, low, close }));
  },

  async search(query: string): Promise<CoinSearchResult[]> {
    const data = await get<{ coins: CoinSearchResult[] }>('/search', { query });
    return data.coins.slice(0, 20);
  },

  async getExchangeRate(): Promise<number> {
    const data = await get<{ bitcoin: { idr: number } }>('/simple/price', {
      ids: 'bitcoin',
      vs_currencies: 'idr',
    });
    return data.bitcoin.idr / (await get<{ bitcoin: { usd: number } }>('/simple/price', { ids: 'bitcoin', vs_currencies: 'usd' })).bitcoin.usd;
  },

  async getUsdToIdr(): Promise<number> {
    // Use BTC as bridge: BTC/IDR ÷ BTC/USD
    const [idrData, usdData] = await Promise.all([
      get<{ bitcoin: { idr: number } }>('/simple/price', { ids: 'bitcoin', vs_currencies: 'idr' }),
      get<{ bitcoin: { usd: number } }>('/simple/price', { ids: 'bitcoin', vs_currencies: 'usd' }),
    ]);
    return idrData.bitcoin.idr / usdData.bitcoin.usd;
  },
};
