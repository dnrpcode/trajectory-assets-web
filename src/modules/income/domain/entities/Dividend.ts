export interface DividendEvent {
  date: Date;
  amount: number;
}

export interface PricePoint {
  date: Date;
  close: number;
}

export interface DividendInfo {
  ticker: string;
  name: string;
  currentPrice: number;
  currency: string;
  events: DividendEvent[];
  priceHistory: PricePoint[];
  trailingYield: number;
  lastDividend: DividendEvent | null;
  consistentYears: number;
  totalYearsChecked: number;
}

export interface TickerSuggestion {
  ticker: string;
  name: string;
}

export interface WatchlistEntry {
  userId: string;
  ticker: string;
  addedAt: Date;
}
