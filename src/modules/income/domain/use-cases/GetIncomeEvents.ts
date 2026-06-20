import type { IIncomeEventRepository } from '../repositories/IIncomeEventRepository';
import type { IncomeEvent } from '../entities/IncomeEvent';

export class GetIncomeEvents {
  constructor(private repo: IIncomeEventRepository) {}

  async execute(userId: string): Promise<IncomeEvent[]> {
    const events = await this.repo.getAll(userId);
    return events.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }
}
