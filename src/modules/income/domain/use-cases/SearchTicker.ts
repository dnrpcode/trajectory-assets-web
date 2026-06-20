import type { IDividendRepository } from '../repositories/IDividendRepository';
import type { TickerSuggestion } from '../entities/Dividend';

export class SearchTicker {
  constructor(private repo: IDividendRepository) {}

  async execute(query: string): Promise<TickerSuggestion[]> {
    if (query.trim().length < 2) return [];
    return this.repo.searchTicker(query.trim());
  }
}
