import { IWatchlistRepository } from '../repositories/IWatchlistRepository';

export class RemoveFromWatchlist {
  constructor(private repo: IWatchlistRepository) {}
  execute(userId: string, coinId: string): Promise<void> {
    return this.repo.remove(userId, coinId);
  }
}
