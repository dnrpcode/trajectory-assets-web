import { User } from '@/shared/types/user';

export interface IUserRepository {
  getById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
  update(id: string, data: Partial<User>): Promise<void>;
}
