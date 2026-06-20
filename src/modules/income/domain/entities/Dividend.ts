export interface DividendEvent {
  date: Date;
  amount: number;
}

export interface DividendInfo {
  ticker: string;
  name: string;
  currentPrice: number;
  currency: string;
  events: DividendEvent[];
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
