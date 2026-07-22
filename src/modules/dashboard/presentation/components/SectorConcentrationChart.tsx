import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { Asset } from '@/shared/types/asset';
import { computeSectorConcentration } from '@/shared/utils/portfolioProjections';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

interface Props { assets: Asset[]; }

const SECTOR_COLORS: Record<string, string> = {
  Financials: '#4d7cff',
  Energy: '#f59e0b',
  'Basic Materials': '#a78bfa',
  Industrials: '#06b6d4',
  'Consumer Cyclicals': '#ec4899',
  'Consumer Non-Cyclicals': '#10b981',
  Healthcare: '#22d3ee',
  'Properties & Real Estate': '#f97316',
  Technology: '#6366f1',
  Infrastructures: '#3b82f6',
  'Transportation & Logistic': '#84cc16',
  unclassified: 'var(--text-muted)',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { pct: number; tickers: string[] } }> }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12, maxWidth: 220 }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{p.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{formatCurrencyCompact(p.value)} · {p.payload.pct.toFixed(1)}%</p>
      {p.payload.tickers.length > 0 && (
        <p style={{ color: 'var(--text-muted)', marginTop: 3 }}>{p.payload.tickers.join(', ')}</p>
      )}
      {p.name === t('dashboard.sector.unclassified') && (
        <p style={{ color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>{t('dashboard.sector.unclassifiedHint')}</p>
      )}
    </div>
  );
}

export function SectorConcentrationChart({ assets }: Props) {
  const { t } = useTranslation();
  const result = computeSectorConcentration(assets);

  if (result.totalStockValueIDR === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t('dashboard.sector.noStocks')}
      </div>
    );
  }

  const data = result.breakdown.map((b) => ({
    name: b.sector === 'unclassified' ? t('dashboard.sector.unclassified') : b.sector,
    value: b.valueIDR,
    pct: b.pct,
    tickers: b.tickers,
    color: SECTOR_COLORS[b.sector] ?? 'var(--text-muted)',
  }));

  return (
    <div>
      {result.isConcentrated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', marginBottom: 10, background: 'var(--warn-tint)', borderRadius: 8 }}>
          <AlertTriangle size={13} style={{ color: 'var(--warn-400)', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--warn-400)' }}>
            {t('dashboard.sector.concentratedWarning', { pct: result.topSectorPct.toFixed(0), sector: result.breakdown[0]?.sector })}
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={88} dataKey="value" paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1 justify-center">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            {d.name}
            <span style={{ color: 'var(--text-muted)' }}>{d.pct.toFixed(0)}%</span>
          </span>
        ))}
      </div>

      {result.classifiedPct < 100 && (
        <p style={{ margin: '8px 0 0', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('dashboard.sector.coverageNote', { pct: result.classifiedPct.toFixed(0) })}
        </p>
      )}
    </div>
  );
}
