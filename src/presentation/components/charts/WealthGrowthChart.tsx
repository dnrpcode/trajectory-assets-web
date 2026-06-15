import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint } from '../../../domain/entities/Portfolio';
import { formatMonth } from '../../../shared/utils/formatDate';
import { formatCurrencyCompact } from '../../../shared/utils/formatCurrency';

interface Props { data: PortfolioHistoryPoint[]; }

export function WealthGrowthChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data historis
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    value: d.totalValueIDR,
    cost: d.totalCostBasisIDR,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
        <defs>
          <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--gain-500)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--gain-500)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
        <XAxis
          dataKey="month"
          tickFormatter={(v: string) => { const [, m] = v.split('-'); return m; }}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrencyCompact(Number(value)), name === 'value' ? 'Nilai Portofolio' : 'Modal']}
          labelFormatter={(label) => formatMonth(String(label))}
          contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
        />
        <Area type="monotone" dataKey="value" name="value" stroke="var(--gain-500)" strokeWidth={2} fillOpacity={1} fill="url(#gradValue)" />
        <Area type="monotone" dataKey="cost" name="cost" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#gradCost)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
