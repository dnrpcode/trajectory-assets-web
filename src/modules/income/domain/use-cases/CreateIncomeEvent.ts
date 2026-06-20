import type { IIncomeEventRepository } from '../repositories/IIncomeEventRepository';
import type { IncomeEvent, IncomeEventType } from '../entities/IncomeEvent';
import type { AssetCategory } from '@/shared/types';

export interface CreateIncomeEventInput {
  userId: string;
  assetId: string;
  assetName: string;
  ticker?: string;
  category: AssetCategory;
  eventType: IncomeEventType;
  exDate?: Date;
  paymentDate: Date;
  estimatedAmountIDR?: number;
  currency: string;
  notes?: string;
}

export class CreateIncomeEvent {
  constructor(private repo: IIncomeEventRepository) {}

  async execute(input: CreateIncomeEventInput): Promise<void> {
    const id = `${input.userId}_income_${Date.now()}`;
    const event: IncomeEvent = {
      id,
      userId: input.userId,
      assetId: input.assetId,
      assetName: input.assetName,
      ticker: input.ticker,
      category: input.category,
      eventType: input.eventType,
      exDate: input.exDate,
      paymentDate: input.paymentDate,
      estimatedAmountIDR: input.estimatedAmountIDR,
      currency: input.currency,
      notes: input.notes,
      status: 'upcoming',
      createdAt: new Date(),
    };
    await this.repo.save(event);
  }
}
