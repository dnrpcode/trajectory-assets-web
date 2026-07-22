import type { PriceAlert } from '../entities/PriceAlert';

export interface MarketSnapshot {
  /** coinId → harga USD saat ini */
  prices: Record<string, number>;
  /** coinId → RSI(14) saat ini — hanya perlu diisi untuk coin yang punya alert RSI */
  rsi: Record<string, number>;
}

export interface TriggeredAlert {
  alert: PriceAlert;
  value: number;
}

/**
 * Pure — cek alert aktif mana yang kondisinya terpenuhi terhadap snapshot
 * market saat ini. Tidak menyentuh Firestore/notifikasi; pemanggil yang
 * bertanggung jawab menandai triggered & mengirim notifikasi.
 */
export class EvaluatePriceAlerts {
  execute(alerts: PriceAlert[], snapshot: MarketSnapshot): TriggeredAlert[] {
    const triggered: TriggeredAlert[] = [];
    for (const alert of alerts) {
      if (!alert.active) continue;
      const value = alert.metric === 'price' ? snapshot.prices[alert.coinId] : snapshot.rsi[alert.coinId];
      if (value === undefined || isNaN(value)) continue;
      const hit = alert.condition === 'above' ? value >= alert.threshold : value <= alert.threshold;
      if (hit) triggered.push({ alert, value });
    }
    return triggered;
  }
}
