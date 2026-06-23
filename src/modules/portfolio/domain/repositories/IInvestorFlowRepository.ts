import type { InvestorFlowData } from '../entities/InvestorFlow';

export interface IInvestorFlowRepository {
  getFlow(ticker: string): Promise<InvestorFlowData>;
}
