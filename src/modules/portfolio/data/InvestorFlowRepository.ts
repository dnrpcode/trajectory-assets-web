import type { IInvestorFlowRepository } from '../domain/repositories/IInvestorFlowRepository';
import type { InvestorFlowData } from '../domain/entities/InvestorFlow';

export class InvestorFlowRepository implements IInvestorFlowRepository {
  async getFlow(ticker: string): Promise<InvestorFlowData> {
    const code = ticker.replace(/\.JK$/i, '').toUpperCase();
    const res = await fetch(`/api/market/flow?ticker=${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error(`Flow fetch failed: ${res.status}`);
    return res.json() as Promise<InvestorFlowData>;
  }
}
