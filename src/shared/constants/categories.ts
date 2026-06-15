import { AssetCategory } from '../types';

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  saham: 'Saham',
  reksa_dana: 'Reksa Dana',
  obligasi_sbn: 'Obligasi / SBN',
  emas: 'Emas',
  kripto: 'Kripto',
  cash: 'Cash / Deposito',
  lainnya: 'Lainnya',
};

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  saham: '#6366f1',
  reksa_dana: '#8b5cf6',
  obligasi_sbn: '#06b6d4',
  emas: '#f59e0b',
  kripto: '#f97316',
  cash: '#22d3ee',
  lainnya: '#6b7280',
};

export const ALL_CATEGORIES: AssetCategory[] = [
  'saham',
  'reksa_dana',
  'obligasi_sbn',
  'emas',
  'kripto',
  'cash',
  'lainnya',
];
