export type RotationConfidence = 'high' | 'medium' | 'low';

export interface RotationWindow {
  ticker: string;
  name: string;
  monthIndex: number; // 0-11, target month this year
  entryDate: Date;
  exitDate: Date;
  expectedDividendYieldPct: number;
  expectedPriceReturnPct: number;
  expectedTotalReturnPct: number;
  confidence: RotationConfidence;
  occurrences: number; // how many of the last years this pattern showed up
  yearsChecked: number;
}

export interface RotationRoadmap {
  windows: RotationWindow[]; // chosen, non-overlapping, chronological
  totalExpectedReturnPct: number;
}
