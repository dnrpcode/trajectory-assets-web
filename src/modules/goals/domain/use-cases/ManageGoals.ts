import type { Goal } from '../entities/Goal';
import type { IGoalRepository, CreateGoalInput, UpdateGoalInput } from '../repositories/IGoalRepository';

export class GetGoals {
  constructor(private repo: IGoalRepository) {}
  execute(userId: string): Promise<Goal[]> {
    return this.repo.getByUserId(userId);
  }
}

export class CreateGoal {
  constructor(private repo: IGoalRepository) {}
  execute(input: Omit<CreateGoalInput, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date();
    return this.repo.create({ ...input, createdAt: now, updatedAt: now });
  }
}

export class UpdateGoal {
  constructor(private repo: IGoalRepository) {}
  execute(userId: string, goalId: string, input: UpdateGoalInput): Promise<void> {
    return this.repo.update(userId, goalId, input);
  }
}

export class DeleteGoal {
  constructor(private repo: IGoalRepository) {}
  execute(userId: string, goalId: string): Promise<void> {
    return this.repo.delete(userId, goalId);
  }
}
