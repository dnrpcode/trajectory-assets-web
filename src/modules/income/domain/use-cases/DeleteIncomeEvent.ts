import type { IIncomeEventRepository } from '../repositories/IIncomeEventRepository';

export class DeleteIncomeEvent {
  constructor(private repo: IIncomeEventRepository) {}

  async execute(userId: string, eventId: string): Promise<void> {
    await this.repo.delete(userId, eventId);
  }
}
