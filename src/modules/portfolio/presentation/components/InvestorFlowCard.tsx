import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip } from 'recharts';
import { useInvestorFlow, type FlowSignal } from '../hooks/useInvestorFlow';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

const SIGNAL_CONFIG: Record<FlowSignal, { label: string; color: string; bg: string; border: string; desc: string }> = {
  strong_accumulation: {
    label: 'Akumulasi Kuat', color: 'var(--gain-400)',
    bg: 'rgba(15,186,130,0.08)', border: 'rgba(15,186,130,0.25)',
    desc: 'Volume beli mendominasi kuat — indikasi institusi aktif akumulasi.',
  },
  accumulation: {
    label: 'Akumulasi', color: 'var(--gain-400)',
    bg: 'rgba(15,186,130,0.06)', border: 'rgba(15,186,130,0.18)',
    desc: 'Lebih banyak beli dari jual secara volume-weighted.',
  },
  neutral: {
    label: 'Netral', color: 'var(--text-muted)',
    bg: 'var(--bg-raised)', border: 'var(--border-subtle)',
    desc: 'Tidak ada tekanan beli atau jual yang dominan.',
  },
  distribution: {
    label: 'Distribusi', color: 'var(--loss-400)',
    bg: 'rgba(240,71,106,0.06)', border: 'rgba(240,71,106,0.18)',
    desc: 'Volume jual mulai mendominasi — waspadai tekanan jual.',
  },
  strong_distribution: {
    label: 'Distribusi Kuat', color: 'var(--loss-400)',
    bg: 'rgba(240,71,106,0.08)', border: 'rgba(240,71,106,0.25)',
    desc: 'Volume jual mendominasi kuat — indikasi institusi aktif keluar.',
  },
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp size={12} strokeWidth={2.5} style={{ color: 'var(--gain-400)' }} />;
  if (trend === 'falling') return <TrendingDown size={12} strokeWidth={2.5} style={{ color: 'var(--loss-400)' }} />;
  return <Minus size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />;
}

function CmfTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '6px 10px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ color: v >= 0 ? 'var(--gain-400)' : 'var(--loss-400)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
        CMF {v >= 0 ? '+' : ''}{(v * 100).toFixed(1)}
      </p>
    </div>
  );
}

export function InvestorFlowCard({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useInvestorFlow(ticker);
  const cfg = data ? SIGNAL_CONFIG[data.signal] : null;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Aliran Dana (CMF · OBV)</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Chaikin Money Flow 20 hari · On-Balance Volume</p>
        </div>
        <button onClick={() => refetch()} title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', borderRadius: 6 }}>
          <RefreshCw size={14} strokeWidth={2} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {isLoading && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</div>
      )}

      {isError && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Data tidak tersedia untuk saham ini</p>
        </div>
      )}

      {data && cfg && (
        <>
          {/* Signal badge */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: cfg.color }}>
                CMF {data.cmf >= 0 ? '+' : ''}{(data.cmf * 100).toFixed(1)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{cfg.desc}</p>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)' }}>
            {[
              { label: 'CMF Trend', node: <TrendIcon trend={data.cmfTrend} />, sub: data.cmfTrend === 'rising' ? 'Menguat' : data.cmfTrend === 'falling' ? 'Melemah' : 'Flat' },
              { label: 'OBV Trend', node: <TrendIcon trend={data.obvTrend} />, sub: data.obvTrend === 'rising' ? 'Naik' : data.obvTrend === 'falling' ? 'Turun' : 'Flat' },
              { label: 'Volume Terakhir', node: null, sub: formatCurrencyCompact(data.series[data.series.length - 1]?.volume ?? 0) + ' lot' },
            ].map(({ label, node, sub }) => (
              <div key={label} style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid var(--border-dim)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: 600 }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {node}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CMF Chart */}
          <div style={{ padding: '12px 16px 4px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              CMF 30 Hari Terakhir
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data.series.filter(s => s.cmf !== null)} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[-0.5, 0.5]} />
                <Tooltip content={<CmfTooltip />} />
                <ReferenceLine y={0} stroke="var(--border-default)" strokeWidth={1} />
                <Bar dataKey="cmf" radius={[2, 2, 0, 0]} maxBarSize={12}>
                  {data.series.filter(s => s.cmf !== null).map((entry, i) => (
                    <Cell key={i} fill={(entry.cmf ?? 0) >= 0 ? 'var(--gain-400)' : 'var(--loss-400)'} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{data.series[0]?.date}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{data.series[data.series.length - 1]?.date}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', marginTop: 4 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              CMF &gt; 0 = tekanan beli (akumulasi) · CMF &lt; 0 = tekanan jual (distribusi). Berdasarkan data harga & volume harian. Data IDX real-time asing/domestik memerlukan layanan berbayar (Stockbit Pro, RTI Business).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
