export interface Goal {
  id: string;
  userId: string;
  targetAmountIDR: number;
  targetDate?: Date;
  monthlyContributionIDR?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
