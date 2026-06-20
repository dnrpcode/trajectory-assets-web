import type { WatchlistEntry } from '../entities/Dividend';

export interface IDividendWatchlistRepository {
  getAll(userId: string): Promise<WatchlistEntry[]>;
  add(userId: string, ticker: string): Promise<void>;
  remove(userId: string, ticker: string): Promise<void>;
}
