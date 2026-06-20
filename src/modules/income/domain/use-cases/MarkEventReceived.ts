import type { IIncomeEventRepository } from '../repositories/IIncomeEventRepository';

export class MarkEventReceived {
  constructor(private repo: IIncomeEventRepository) {}

  async execute(userId: string, eventId: string): Promise<void> {
    await this.repo.markReceived(userId, eventId);
  }
}
