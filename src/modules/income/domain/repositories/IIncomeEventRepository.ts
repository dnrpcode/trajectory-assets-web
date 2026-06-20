import type { IncomeEvent } from '../entities/IncomeEvent';

export interface IIncomeEventRepository {
  getAll(userId: string): Promise<IncomeEvent[]>;
  save(event: IncomeEvent): Promise<void>;
  delete(userId: string, eventId: string): Promise<void>;
  markReceived(userId: string, eventId: string): Promise<void>;
}
