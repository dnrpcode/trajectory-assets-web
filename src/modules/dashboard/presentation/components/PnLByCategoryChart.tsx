import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { Asset } from '@/modules/portfolio';
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '@/shared/constants/categories';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { AssetCategory } from '@/shared/types';

interface Props { assets: Asset[]; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ color: val >= 0 ? 'var(--gain-500)' : 'var(--loss-500)', fontWeight: 600 }}>
          {val >= 0 ? '+' : ''}{formatCurrencyCompact(val)}
        </p>
      </div>
    );
  }
  return null;
};

export function PnLByCategoryChart({ assets }: Props) {
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data
      </div>
    );
  }

  const byCategory: Record<string, number> = {};
  for (const a of assets) {
    const cat = a.category as AssetCategory;
    const pnl = a.unrealizedGainIDR + a.realizedGainIDR + a.totalIncomeIDR - a.totalFeesIDR;
    byCategory[cat] = (byCategory[cat] ?? 0) + pnl;
  }

  const data = ALL_CATEGORIES
    .filter((cat) => byCategory[cat] !== undefined)
    .map((cat) => ({
      name: CATEGORY_LABELS[cat],
      value: byCategory[cat],
      color: CATEGORY_COLORS[cat],
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 12 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)', radius: 4 }} />
        <ReferenceLine y={0} stroke="var(--border-subtle)" strokeWidth={1} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.value >= 0 ? 'var(--gain-500)' : 'var(--loss-500)'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
