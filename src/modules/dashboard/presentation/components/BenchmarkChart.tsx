import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioSeriesPoint } from '@/shared/utils/portfolioSeries';
import { formatMonth } from '@/shared/utils/formatDate';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

interface Props {
  series: PortfolioSeriesPoint[];
  marketName?: string;
  isLoading?: boolean;
}

interface TooltipPayloadItem { value: number; dataKey: string }

function BenchmarkTooltip({ active, payload, label, marketName }: {
  active?: boolean; payload?: TooltipPayloadItem[]; label?: string; marketName: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload.find((p) => p.dataKey === 'value')?.value;
  const ihsg = payload.find((p) => p.dataKey === 'ihsg')?.value;
  const diffPct = value != null && ihsg != null && ihsg > 0 ? ((value - ihsg) / ihsg) * 100 : null;

  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px' }}>{formatMonth(String(label))}</p>
      {value != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Portofolio</span>
          <span style={{ color: 'var(--blue-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrencyCompact(value)}</span>
        </div>
      )}
      {ihsg != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginTop: 3 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Jika beli {marketName}</span>
          <span style={{ color: 'var(--warn-400)', fontFamily: 'var(--font-mono)' }}>{formatCurrencyCompact(ihsg)}</span>
        </div>
      )}
      {diffPct != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-dim)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Selisih</span>
          <span style={{ color: diffPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function BenchmarkChart({ series, marketName = 'IHSG', isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Memuat data {marketName}…
      </div>
    );
  }

  const chartData = series.filter((p) => p.ihsg != null);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data {marketName} yang cukup untuk perbandingan
      </div>
    );
  }

  const last = chartData[chartData.length - 1];
  const outperformPct = last.ihsg && last.ihsg > 0 ? ((last.value - last.ihsg) / last.ihsg) * 100 : 0;
  const outColor = outperformPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)';

  return (
    <div>
      <div className="flex items-center gap-4 px-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--blue-400)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Portofolio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: 'var(--warn-400)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Jika dana yang sama dibelikan {marketName}</span>
        </div>
        <span className="text-xs ml-auto font-mono font-semibold" style={{ color: outColor }}>
          {outperformPct >= 0 ? '+' : ''}{outperformPct.toFixed(1)}% vs {marketName}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
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
          <Tooltip content={<BenchmarkTooltip marketName={marketName} />} />
          <Line type="monotone" dataKey="value" stroke="var(--blue-400)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--blue-400)' }} />
          <Line type="monotone" dataKey="ihsg" stroke="var(--warn-400)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--warn-400)' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
