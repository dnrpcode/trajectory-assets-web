import { IWatchlistRepository } from '../../repositories/IWatchlistRepository';
import { WatchlistCoin } from '../../entities/Watchlist';

export class AddToWatchlist {
  constructor(private repo: IWatchlistRepository) {}
  execute(userId: string, coin: Omit<WatchlistCoin, 'addedAt'>): Promise<void> {
    return this.repo.add(userId, { ...coin, addedAt: new Date() });
  }
}
