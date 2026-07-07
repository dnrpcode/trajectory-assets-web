// Domain entities
export type { Goal, GoalProgress, GoalRoadmap, GoalRoadmapItem, RoadmapAdvice, RoadmapAdviceType } from './domain/entities/Goal';

// Domain repositories
export type { IGoalRepository, CreateGoalInput, UpdateGoalInput } from './domain/repositories/IGoalRepository';

// Domain use-cases
export { GetGoals, CreateGoal, UpdateGoal, DeleteGoal } from './domain/use-cases/ManageGoals';
export { BuildGoalRoadmap } from './domain/use-cases/BuildGoalRoadmap';

// Data
export { FirebaseGoalRepository } from './data/FirebaseGoalRepository';

// Hooks
export { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from './presentation/hooks/useGoals';
export type { GoalFormInput } from './presentation/hooks/useGoals';

// Pages
export { GoalsPage } from './presentation/pages/GoalsPage';
