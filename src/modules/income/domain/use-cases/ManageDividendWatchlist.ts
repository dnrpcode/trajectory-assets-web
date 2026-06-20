import type { IDividendWatchlistRepository } from '../repositories/IDividendWatchlistRepository';
import type { WatchlistEntry } from '../entities/Dividend';

export class GetDividendWatchlist {
  constructor(private repo: IDividendWatchlistRepository) {}
  async execute(userId: string): Promise<WatchlistEntry[]> {
    return this.repo.getAll(userId);
  }
}

export class AddToDividendWatchlist {
  constructor(private repo: IDividendWatchlistRepository) {}
  async execute(userId: string, ticker: string): Promise<void> {
    return this.repo.add(userId, ticker);
  }
}

export class RemoveFromDividendWatchlist {
  constructor(private repo: IDividendWatchlistRepository) {}
  async execute(userId: string, ticker: string): Promise<void> {
    return this.repo.remove(userId, ticker);
  }
}
