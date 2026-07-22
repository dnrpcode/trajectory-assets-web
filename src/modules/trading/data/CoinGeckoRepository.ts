import { ICoinGeckoRepository } from '../domain/repositories/ICoinGeckoRepository';
import { CoinMarket, OHLCPoint, CoinSearchResult } from '../domain/entities/Market';

export type { CoinMarket, OHLCPoint, CoinSearchResult };

const BASE = 'https://api.coingecko.com/api/v3';

export class CoinGeckoError extends Error {
  constructor(
    public readonly status: number,
    path: string,
    public readonly retryAfter: number | null = null,
  ) {
    super(`CoinGecko ${status}: ${path}`);
    this.name = 'CoinGeckoError';
  }

  get isRateLimit() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }
  get isUnauthorized() { return this.status === 401; }
}

export function getCoinGeckoErrorMessage(error: unknown): string {
  if (error instanceof CoinGeckoError) {
    if (error.isRateLimit) {
      const wait = error.retryAfter
        ? ` Coba lagi dalam ${error.retryAfter} detik.`
        : ' Coba lagi dalam beberapa menit.';
      return `Batas permintaan API tercapai.${wait}`;
    }
    if (error.isUnauthorized) return 'API key tidak valid.';
    if (error.isServerError) return 'Server CoinGecko sedang bermasalah. Coba lagi nanti.';
    return `Gagal memuat data (kode ${error.status}).`;
  }
  if (error instanceof TypeError) return 'Tidak dapat terhubung ke CoinGecko. Periksa koneksi internet.';
  return 'Gagal memuat data. Coba lagi.';
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
    throw new CoinGeckoError(res.status, path, retryAfter);
  }
  return res.json() as Promise<T>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class CoinGeckoRepositoryImpl implements ICoinGeckoRepository {
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
  }

  async getOHLC(coinId: string, days = 30): Promise<OHLCPoint[]> {
    const raw = await get<{ prices: [number, number][] }>(
      `/coins/${coinId}/market_chart`,
      { vs_currency: 'usd', days: String(days) },
    );
    return raw.prices.map(([time, price]) => ({
      time, open: price, high: price, low: price, close: price,
    }));
  }

  async getMarketChart(coinId: string, days = 30): Promise<number[]> {
    const raw = await get<{ prices: [number, number][] }>(
      `/coins/${coinId}/market_chart`,
      { vs_currency: 'usd', days: String(days) },
    );
    return raw.prices.map(([, price]) => price);
  }

  async search(query: string): Promise<CoinSearchResult[]> {
    const data = await get<{ coins: CoinSearchResult[] }>('/search', { query });
    return data.coins.slice(0, 20);
  }

  async getUsdToIdr(): Promise<number> {
    const [idrData, usdData] = await Promise.all([
      get<{ bitcoin: { idr: number } }>('/simple/price', { ids: 'bitcoin', vs_currencies: 'idr' }),
      get<{ bitcoin: { usd: number } }>('/simple/price', { ids: 'bitcoin', vs_currencies: 'usd' }),
    ]);
    return idrData.bitcoin.idr / usdData.bitcoin.usd;
  }
}

export const coinGeckoRepository: ICoinGeckoRepository = new CoinGeckoRepositoryImpl();
export const CoinGeckoService = coinGeckoRepository;
export { sleep };
