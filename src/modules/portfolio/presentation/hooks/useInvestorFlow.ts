import { useQuery } from '@tanstack/react-query';
import { investorFlowRepository } from '@/infrastructure/di/container';

export type {
  FlowSeriesPoint,
  ScorecardPoint,
  FlowSignal,
  InvestorFlowData,
} from '../../domain/entities/InvestorFlow';

export function useInvestorFlow(ticker: string | undefined) {
  const code = ticker ? ticker.replace(/\.JK$/i, '').toUpperCase() : undefined;
  return useQuery({
    queryKey: ['investorFlow', code],
    queryFn: () => investorFlowRepository.getFlow(code!),
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}
