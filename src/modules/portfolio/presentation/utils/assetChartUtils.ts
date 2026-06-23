import type { AssetEntry } from '../../domain/entities/AssetEntry';

const PRICE_ENTRY_TYPES = new Set(['new_position', 'price_update', 'top_up', 'partial_sell', 'full_sell']);

export function buildPriceHistory(entries: AssetEntry[]): { date: string; price: number }[] {
  return entries
    .filter((e) => !e.isCorrected && PRICE_ENTRY_TYPES.has(e.entryType) && e.pricePerUnit != null)
    .map((e) => ({
      date: e.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }),
      price: e.pricePerUnit!,
    }));
}
