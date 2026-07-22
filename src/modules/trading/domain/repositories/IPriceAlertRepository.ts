import type { PriceAlert, CreatePriceAlertInput } from '../entities/PriceAlert';

export interface IPriceAlertRepository {
  getByUserId(userId: string): Promise<PriceAlert[]>;
  create(input: CreatePriceAlertInput): Promise<void>;
  markTriggered(userId: string, alertId: string, value: number): Promise<void>;
  delete(userId: string, alertId: string): Promise<void>;
}
