import { useQuery } from '@tanstack/react-query';
import { fetchDailyHistory, fetchNews } from '../../data/forecastApi';
import { computeForecast } from '../../domain/use-cases/ComputeForecast';
import type { ForecastResult, NewsItem } from '../../domain/entities/Forecast';

function toJK(ticker: string): string {
  return ticker.includes('.') ? ticker : `${ticker}.JK`;
}

export interface StockForecast {
  result: ForecastResult | null;
  lastPrice: number;
  marketState: string;
}

export function useStockForecast(ticker: string | undefined) {
  const symbol = ticker ? toJK(ticker) : undefined;
  return useQuery({
    queryKey: ['stockForecast', symbol],
    queryFn: async (): Promise<StockForecast> => {
      const { bars, lastPrice, marketState } = await fetchDailyHistory(ticker!);
      const result = computeForecast.execute(bars, 1000);
      return { result, lastPrice, marketState };
    },
    enabled: !!symbol,
    staleTime: 30 * 60_000, // 30 min — daily model barely moves intraday
    gcTime: 10 * 60_000,
    retry: 1,
  });
}

export function useStockNews(ticker: string | undefined) {
  const symbol = ticker ? toJK(ticker) : undefined;
  return useQuery({
    queryKey: ['stockNews', symbol],
    queryFn: async (): Promise<NewsItem[]> => fetchNews(ticker!),
    enabled: !!symbol,
    staleTime: 30 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}
