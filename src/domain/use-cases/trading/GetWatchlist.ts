import { IWatchlistRepository } from '../../repositories/IWatchlistRepository';
import { WatchlistCoin } from '../../entities/Watchlist';

export class GetWatchlist {
  constructor(private repo: IWatchlistRepository) {}
  execute(userId: string): Promise<WatchlistCoin[]> {
    return this.repo.getAll(userId);
  }
}
