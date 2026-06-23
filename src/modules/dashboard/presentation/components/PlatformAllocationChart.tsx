import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset } from '@/modules/portfolio';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

interface Props { assets: Asset[]; }

const PLATFORM_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#f97316',
  '#22d3ee', '#10b981', '#ec4899', '#3b82f6', '#a78bfa',
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { pct: number } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text-secondary)' }}>{formatCurrencyCompact(payload[0].value)}</p>
        <p style={{ color: 'var(--text-muted)' }}>{payload[0].payload.pct.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export function PlatformAllocationChart({ assets }: Props) {
  const active = assets.filter((a) => a.status === 'active');

  if (active.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data
      </div>
    );
  }

  const byPlatform: Record<string, number> = {};
  for (const a of active) {
    const p = a.platform || 'Lainnya';
    byPlatform[p] = (byPlatform[p] ?? 0) + a.currentValueIDR;
  }

  const total = Object.values(byPlatform).reduce((s, v) => s + v, 0);
  const data = Object.entries(byPlatform)
    .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={88}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1 justify-center">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[i % PLATFORM_COLORS.length] }} />
            {d.name}
            <span style={{ color: 'var(--text-muted)' }}>{d.pct.toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
