import type { IDividendRepository } from '../domain/repositories/IDividendRepository';
import type { DividendInfo, DividendEvent, TickerSuggestion } from '../domain/entities/Dividend';

export class DividendError extends Error {
  constructor(
    public readonly status: number,
    public readonly ticker: string,
  ) {
    super(`Dividend data error ${status}: ${ticker}`);
    this.name = 'DividendError';
  }
  get isNotFound() { return this.status === 404; }
  get isRateLimit() { return this.status === 429; }
}

export function getDividendErrorMessage(error: unknown): string {
  if (error instanceof DividendError) {
    if (error.isNotFound) return `Ticker ${error.ticker} tidak ditemukan di IDX.`;
    if (error.isRateLimit) return 'Terlalu banyak permintaan. Coba lagi dalam beberapa saat.';
    return `Gagal memuat data (${error.status}).`;
  }
  if (error instanceof TypeError) return 'Tidak dapat terhubung ke sumber data. Periksa koneksi internet.';
  return 'Gagal memuat data dividen.';
}

const CHART = '/api/dividend/chart';
const SEARCH = '/api/dividend/search';

type RawDividend = { amount: number; date: number };
type ChartResult = {
  meta: { regularMarketPrice: number; shortName?: string; currency?: string };
  events?: { dividends?: Record<string, RawDividend> };
};
type ChartResponse = { chart: { result: ChartResult[] | null; error?: { description: string } } };
type SearchQuote = { symbol: string; shortname?: string; longname?: string; exchDisp?: string };
type SearchResponse = { quotes: SearchQuote[] };

class YahooDividendRepositoryImpl implements IDividendRepository {
  private toJK(ticker: string) {
    return ticker.includes('.') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`;
  }

  async getDividendInfo(ticker: string): Promise<DividendInfo> {
    const yTicker = this.toJK(ticker);
    const url = `${CHART}?ticker=${encodeURIComponent(yTicker)}`;

    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch {
      throw new TypeError('Network error');
    }

    if (res.status === 429) throw new DividendError(429, ticker);
    if (!res.ok) throw new DividendError(res.status === 404 ? 404 : res.status, ticker);

    const json = (await res.json()) as ChartResponse;
    const result = json.chart.result?.[0];
    if (!result) throw new DividendError(404, ticker);

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice ?? 0;
    const name = meta.shortName ?? ticker.toUpperCase();
    const currency = meta.currency ?? 'IDR';

    const rawDivs = result.events?.dividends ?? {};
    const events: DividendEvent[] = Object.values(rawDivs)
      .map((d) => ({ date: new Date(d.date * 1000), amount: d.amount }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const trailing12m = events
      .filter((d) => d.date >= oneYearAgo)
      .reduce((sum, d) => sum + d.amount, 0);

    const currentYear = new Date().getFullYear();
    const yearsWithDiv = new Set(
      events
        .filter((d) => d.date.getFullYear() >= currentYear - 4)
        .map((d) => d.date.getFullYear()),
    );

    return {
      ticker: ticker.toUpperCase(),
      name,
      currentPrice,
      currency,
      events,
      trailingYield: currentPrice > 0 ? (trailing12m / currentPrice) * 100 : 0,
      lastDividend: events[events.length - 1] ?? null,
      consistentYears: yearsWithDiv.size,
      totalYearsChecked: 5,
    };
  }

  async searchTicker(query: string): Promise<TickerSuggestion[]> {
    const url = `${SEARCH}?q=${encodeURIComponent(query + ' JK')}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch {
      return [];
    }
    if (!res.ok) return [];

    const json = (await res.json()) as SearchResponse;
    return (json.quotes ?? [])
      .filter((q) => q.symbol?.endsWith('.JK'))
      .slice(0, 6)
      .map((q) => ({
        ticker: q.symbol.replace('.JK', ''),
        name: q.shortname ?? q.longname ?? q.symbol,
      }));
  }
}

export const yahooDividendRepository: IDividendRepository = new YahooDividendRepositoryImpl();
