export interface CreateGoalInput {
  userId: string;
  targetAmountIDR: number;
  targetDate?: string;
  monthlyContributionIDR?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoalRepository {
  create(input: CreateGoalInput): Promise<void>;
}
