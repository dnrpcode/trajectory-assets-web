export type AlertMetric = 'price' | 'rsi';
export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  active: boolean;
  triggeredAt?: Date;
  triggeredValue?: number;
  createdAt: Date;
}

export interface CreatePriceAlertInput {
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
}
