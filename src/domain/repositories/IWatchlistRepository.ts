import { WatchlistCoin } from '../entities/Watchlist';

export interface IWatchlistRepository {
  getAll(userId: string): Promise<WatchlistCoin[]>;
  add(userId: string, coin: WatchlistCoin): Promise<void>;
  remove(userId: string, coinId: string): Promise<void>;
}
