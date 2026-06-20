export type TradeSide = 'buy' | 'sell';

export interface PaperTrade {
  id: string;
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  side: TradeSide;
  priceUSD: number;
  entryPriceUSD: number;
  stopLossUSD?: number;
  takeProfitUSD?: number;
  leverage: number;
  exchangeRateToIDR: number;
  amountIDR: number;
  effectiveAmountIDR: number; // amountIDR * leverage
  units: number;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'MANUAL';
  notes?: string;
  date: Date;
  createdAt: Date;
}
