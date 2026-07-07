import type { Goal } from '../entities/Goal';

export interface CreateGoalInput {
  userId: string;
  name?: string;
  targetAmountIDR: number;
  /** "YYYY-MM-DD" */
  targetDate?: string;
  monthlyContributionIDR?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full replace atas field yang bisa diedit — field opsional yang undefined
 * akan DIHAPUS dari dokumen, bukan dibiarkan.
 */
export interface UpdateGoalInput {
  name?: string;
  targetAmountIDR: number;
  /** "YYYY-MM-DD" */
  targetDate?: string;
  monthlyContributionIDR?: number;
  description?: string;
}

export interface IGoalRepository {
  getByUserId(userId: string): Promise<Goal[]>;
  create(input: CreateGoalInput): Promise<void>;
  update(userId: string, goalId: string, input: UpdateGoalInput): Promise<void>;
  delete(userId: string, goalId: string): Promise<void>;
}
