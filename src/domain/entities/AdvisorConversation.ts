import { AllocationTarget, RiskProfile } from '../../shared/types';

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdvisorAction {
  type: 'updateRiskProfile' | 'updateTargetAllocation';
  riskProfile?: RiskProfile;
  targetAllocation?: AllocationTarget;
  summary: string;
}

export interface AdvisorResponse {
  text: string;
  action: AdvisorAction | null;
}
