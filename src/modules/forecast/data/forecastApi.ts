import type { DailyBar, NewsItem } from '../domain/entities/Forecast';

function toJK(ticker: string): string {
  return ticker.includes('.') ? ticker : `${ticker}.JK`;
}

export interface DailyHistory {
  bars: DailyBar[];
  lastPrice: number;
  marketState: string; // 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
}

/** Fetch ~6 months of daily closes for the forecast model. */
export async function fetchDailyHistory(ticker: string): Promise<DailyHistory> {
  const symbol = toJK(ticker);
  const url = `/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=6mo&interval=1d`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Market API ${res.status}`);

  const json = (await res.json()) as {
    chart: {
      result: Array<{
        meta: Record<string, number | string>;
        timestamp: number[];
        indicators: { quote: Array<{ close: (number | null)[] }> };
      }> | null;
      error?: { description: string };
    };
  };
  if (json.chart?.error) throw new Error(json.chart.error.description);

  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No market data');

  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  const bars: DailyBar[] = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      close: closes[i] ?? null,
    }))
    .filter((b): b is DailyBar => b.close !== null && Number.isFinite(b.close) && b.close > 0);

  const meta = result.meta;
  const lastPrice = Number(meta.regularMarketPrice ?? bars[bars.length - 1]?.close ?? 0);
  const marketState = String(meta.marketState ?? 'CLOSED');

  return { bars, lastPrice, marketState };
}

/** Fetch related news headlines (no sentiment — pure context). */
export async function fetchNews(ticker: string): Promise<NewsItem[]> {
  const symbol = toJK(ticker);
  const url = `/api/market/news?q=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`News API ${res.status}`);

  const json = (await res.json()) as {
    news?: Array<{
      title?: string;
      publisher?: string;
      link?: string;
      providerPublishTime?: number;
    }>;
  };

  return (json.news ?? [])
    .filter((n) => n.title && n.link)
    .map((n) => ({
      title: n.title!,
      publisher: n.publisher ?? '',
      link: n.link!,
      publishedAt: (n.providerPublishTime ?? 0) * 1000,
    }))
    .slice(0, 6);
}
