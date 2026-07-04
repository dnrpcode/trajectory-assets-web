import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioSeriesPoint } from '@/shared/utils/portfolioSeries';
import { formatMonth } from '@/shared/utils/formatDate';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

interface Props {
  series: PortfolioSeriesPoint[];
  isLoading?: boolean;
}

interface TooltipPayloadItem { value: number; dataKey: string }

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload.find((p) => p.dataKey === 'value')?.value ?? 0;
  const invested = payload.find((p) => p.dataKey === 'invested')?.value ?? 0;
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
  const gainColor = gain >= 0 ? 'var(--gain-400)' : 'var(--loss-400)';

  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px' }}>{formatMonth(String(label))}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Nilai</span>
        <span style={{ color: 'var(--gain-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrencyCompact(value)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginTop: 3 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Modal</span>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrencyCompact(invested)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-dim)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Gain</span>
        <span style={{ color: gainColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {gain >= 0 ? '+' : ''}{formatCurrencyCompact(gain)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

export function WealthGrowthChart({ series, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Memuat riwayat portofolio…
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data historis
      </div>
    );
  }

  const last = series[series.length - 1];
  const totalGain = last.value - last.invested;
  const gainColor = totalGain >= 0 ? 'var(--gain-400)' : 'var(--loss-400)';

  return (
    <div>
      <div className="flex items-center gap-4 px-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--gain-500)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Nilai Portofolio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--text-muted)', borderTop: '1.5px dashed var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Modal Disetor</span>
        </div>
        <span className="text-xs ml-auto font-mono font-semibold" style={{ color: gainColor }}>
          {totalGain >= 0 ? '+' : ''}{formatCurrencyCompact(totalGain)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--gain-500)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--gain-500)" stopOpacity={0} />
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
            domain={['auto', 'auto']}
          />
          <Tooltip content={<GrowthTooltip />} />
          <Area type="monotone" dataKey="value" stroke="var(--gain-500)" strokeWidth={2} fillOpacity={1} fill="url(#gradValue)" />
          <Area type="monotone" dataKey="invested" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
