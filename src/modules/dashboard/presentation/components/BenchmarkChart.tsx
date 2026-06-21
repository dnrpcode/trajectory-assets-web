import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PortfolioHistoryPoint } from '@/modules/dashboard/domain/entities/Portfolio';
import { formatMonth } from '@/shared/utils/formatDate';

interface MarketPoint { month: string; close: number }

interface Props {
  portfolioHistory: PortfolioHistoryPoint[];
  marketHistory: MarketPoint[];
  marketName?: string;
  isLoading?: boolean;
  isError?: boolean;
}

interface ChartRow {
  month: string;
  portfolio: number | null;
  market: number | null;
}

function buildChartData(
  portfolioHistory: PortfolioHistoryPoint[],
  marketHistory: MarketPoint[],
): ChartRow[] {
  if (portfolioHistory.length === 0) return [];

  const marketByMonth = new Map(marketHistory.map((d) => [d.month, d.close]));

  // Find the first portfolio month that also has market data
  let basePortfolio = 0;
  let baseMarket = 0;
  let baseFound = false;

  for (const ph of portfolioHistory) {
    const mClose = marketByMonth.get(ph.month);
    if (mClose && ph.totalValueIDR > 0) {
      basePortfolio = ph.totalValueIDR;
      baseMarket = mClose;
      baseFound = true;
      break;
    }
  }

  if (!baseFound) return [];

  return portfolioHistory
    .map((ph) => {
      const mClose = marketByMonth.get(ph.month);
      return {
        month: ph.month,
        portfolio: basePortfolio > 0 ? ((ph.totalValueIDR / basePortfolio) - 1) * 100 : null,
        market: mClose && baseMarket > 0 ? ((mClose / baseMarket) - 1) * 100 : null,
      };
    })
    .filter((d) => d.portfolio !== null);
}

function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function BenchmarkChart({ portfolioHistory, marketHistory, marketName = 'IHSG', isLoading, isError }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Memuat data {marketName}…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Gagal memuat data {marketName}
      </div>
    );
  }

  const chartData = buildChartData(portfolioHistory, marketHistory);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data historis yang cukup
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 px-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--blue-400)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Portofolio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--warn-400)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{marketName}</span>
        </div>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Return relatif dari bulan pertama (basis = 0%)</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
          <ReferenceLine y={0} stroke="var(--border-subtle)" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tickFormatter={(v: string) => { const [, m] = v.split('-'); return m; }}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              formatPct(Number(value)),
              name === 'portfolio' ? 'Portofolio' : marketName,
            ]}
            labelFormatter={(label) => formatMonth(String(label))}
            contentStyle={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          />
          <Line
            type="monotone"
            dataKey="portfolio"
            name="portfolio"
            stroke="var(--blue-400)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--blue-400)' }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="market"
            name="market"
            stroke="var(--warn-400)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--warn-400)' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
