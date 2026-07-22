import type { PriceAlert, CreatePriceAlertInput } from '../entities/PriceAlert';
import type { IPriceAlertRepository } from '../repositories/IPriceAlertRepository';

export class GetPriceAlerts {
  constructor(private repo: IPriceAlertRepository) {}
  execute(userId: string): Promise<PriceAlert[]> {
    return this.repo.getByUserId(userId);
  }
}

export class CreatePriceAlert {
  constructor(private repo: IPriceAlertRepository) {}
  execute(input: CreatePriceAlertInput): Promise<void> {
    return this.repo.create(input);
  }
}

export class MarkPriceAlertTriggered {
  constructor(private repo: IPriceAlertRepository) {}
  execute(userId: string, alertId: string, value: number): Promise<void> {
    return this.repo.markTriggered(userId, alertId, value);
  }
}

export class DeletePriceAlert {
  constructor(private repo: IPriceAlertRepository) {}
  execute(userId: string, alertId: string): Promise<void> {
    return this.repo.delete(userId, alertId);
  }
}
