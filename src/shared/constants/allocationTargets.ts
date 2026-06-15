import { AllocationTarget, RiskProfile, InvestmentHorizon } from '../types';

type AllocationMap = Record<RiskProfile, Record<InvestmentHorizon, AllocationTarget>>;

export const ALLOCATION_TARGETS: AllocationMap = {
  conservative: {
    short:  { saham: 10, reksa_dana: 35, obligasi_sbn: 35, emas: 15, kripto: 0, cash: 0, lainnya: 5 },
    medium: { saham: 20, reksa_dana: 30, obligasi_sbn: 30, emas: 15, kripto: 0, cash: 0, lainnya: 5 },
    long:   { saham: 20, reksa_dana: 30, obligasi_sbn: 30, emas: 15, kripto: 0, cash: 0, lainnya: 5 },
  },
  moderate: {
    short:  { saham: 25, reksa_dana: 30, obligasi_sbn: 25, emas: 12, kripto: 3, cash: 0, lainnya: 5 },
    medium: { saham: 40, reksa_dana: 25, obligasi_sbn: 20, emas: 10, kripto: 5, cash: 0, lainnya: 0 },
    long:   { saham: 40, reksa_dana: 25, obligasi_sbn: 20, emas: 10, kripto: 5, cash: 0, lainnya: 0 },
  },
  aggressive: {
    short:  { saham: 45, reksa_dana: 20, obligasi_sbn: 10, emas: 8, kripto: 12, cash: 0, lainnya: 5 },
    medium: { saham: 60, reksa_dana: 15, obligasi_sbn: 5,  emas: 5, kripto: 15, cash: 0, lainnya: 0 },
    long:   { saham: 60, reksa_dana: 15, obligasi_sbn: 5,  emas: 5, kripto: 15, cash: 0, lainnya: 0 },
  },
};

export function getAllocationTarget(risk: RiskProfile, horizon: InvestmentHorizon): AllocationTarget {
  return ALLOCATION_TARGETS[risk][horizon];
}
