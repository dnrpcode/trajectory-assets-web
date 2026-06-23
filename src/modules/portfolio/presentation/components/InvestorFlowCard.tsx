import { RefreshCw, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  ReferenceLine, Tooltip, ComposedChart, Line,
} from 'recharts';
import { useInvestorFlow, type FlowSignal, type ScorecardPoint } from '../hooks/useInvestorFlow';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

// ── Tooltip texts ─────────────────────────────────────────────────────────────

const TIPS = {
  cmf: 'Chaikin Money Flow (CMF)\n\nMengukur apakah volume lebih banyak terjadi saat harga naik (beli) atau turun (jual) dalam 20 hari.\n\n> +15 = akumulasi kuat\n−15 s/d +15 = netral\n< −15 = distribusi kuat',
  mfi: 'Money Flow Index (MFI)\n\nVersi RSI berbasis volume. Mengukur kecepatan dan kekuatan aliran dana masuk/keluar.\n\n> 70 = jenuh beli (overbought)\n< 30 = jenuh jual (oversold)\n30–70 = normal',
  obv: 'On-Balance Volume (OBV)\n\nMenjumlahkan volume saat harga naik dan mengurangkan saat harga turun. Tren OBV naik = tekanan beli mendominasi secara kumulatif.',
  buyPct: 'Tekanan Beli (%)\n\nSeberapa dekat harga penutupan terhadap harga tertinggi hari itu.\n\n100% = tutup di high (semua pembeli)\n0% = tutup di low (semua penjual)\n>55% = tekanan beli dominan',
  netFlow: 'Net Aliran Dana\n\nEstimasi nilai bersih tekanan beli/jual per sesi, dihitung dari posisi close dalam range hari × volume × harga.\n\nBar hijau = net beli\nBar merah = net jual\nGaris biru = kumulatif 10 sesi',
  signal: 'Sinyal Komposit\n\nDihitung dari 4 faktor: CMF, MFI, tren OBV, dan rasio sesi akumulasi vs distribusi dalam 10 hari terakhir.\n\nKekuatan sinyal ditunjukkan oleh kotak-kotak di sebelah kanan badge.',
  scorecard: 'Scorecard Harian\n\nBeli% = posisi close dalam range hari\nCMF = nilai CMF hari tersebut\n▲ = sesi akumulasi\n▼ = sesi distribusi\n– = netral',
} as const;

// ── Signal config ─────────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<FlowSignal, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  strong_accumulation: { label: 'Akumulasi Kuat',   emoji: '🟢', color: 'var(--gain-400)', bg: 'rgba(15,186,130,0.08)', border: 'rgba(15,186,130,0.3)' },
  accumulation:        { label: 'Akumulasi',         emoji: '🟩', color: 'var(--gain-400)', bg: 'rgba(15,186,130,0.05)', border: 'rgba(15,186,130,0.2)' },
  neutral:             { label: 'Netral',             emoji: '⬜', color: 'var(--text-secondary)', bg: 'var(--bg-raised)', border: 'var(--border-subtle)' },
  distribution:        { label: 'Distribusi',         emoji: '🟥', color: 'var(--loss-400)', bg: 'rgba(240,71,106,0.05)', border: 'rgba(240,71,106,0.2)' },
  strong_distribution: { label: 'Distribusi Kuat',   emoji: '🔴', color: 'var(--loss-400)', bg: 'rgba(240,71,106,0.08)', border: 'rgba(240,71,106,0.3)' },
};

const DAY_SIGNAL_EMOJI: Record<ScorecardPoint['daySignal'], string> = {
  accumulation: '▲',
  distribution: '▼',
  neutral:      '–',
};
const DAY_SIGNAL_COLOR: Record<ScorecardPoint['daySignal'], string> = {
  accumulation: 'var(--gain-400)',
  distribution: 'var(--loss-400)',
  neutral:      'var(--text-muted)',
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(Math.round(n));
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising')  return <TrendingUp  size={12} strokeWidth={2.5} style={{ color: 'var(--gain-400)' }} />;
  if (trend === 'falling') return <TrendingDown size={12} strokeWidth={2.5} style={{ color: 'var(--loss-400)' }} />;
  return <Minus size={12} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />;
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────

function GaugeBar({ value, min, max, zones }: {
  value: number; min: number; max: number;
  zones: { from: number; to: number; color: string }[];
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'visible', background: 'var(--bg-base)', display: 'flex' }}>
      {zones.map((z, i) => {
        const left = ((z.from - min) / (max - min)) * 100;
        const width = ((z.to - z.from) / (max - min)) * 100;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${left}%`, width: `${width}%`,
            height: '100%', background: z.color, opacity: 0.25,
            borderRadius: i === 0 ? '4px 0 0 4px' : i === zones.length - 1 ? '0 4px 4px 0' : 0,
          }} />
        );
      })}
      {/* needle */}
      <div style={{
        position: 'absolute', left: `${Math.max(0, Math.min(100, pct))}%`,
        top: -3, transform: 'translateX(-50%)',
        width: 3, height: 14, borderRadius: 2,
        background: value >= 0 || max === 100 ? 'var(--text-primary)' : 'var(--text-primary)',
        boxShadow: '0 0 4px rgba(0,0,0,0.4)',
      }} />
    </div>
  );
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

function NetFlowTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const netFlow = payload.find(p => p.name === 'netFlow');
  const cumFlow = payload.find(p => p.name === 'cumFlow');
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {netFlow && <p style={{ color: (netFlow.value ?? 0) >= 0 ? 'var(--gain-400)' : 'var(--loss-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        Net {(netFlow.value ?? 0) >= 0 ? '+' : ''}{fmt(netFlow.value ?? 0)}
      </p>}
      {cumFlow && <p style={{ color: 'var(--blue-300)', fontFamily: 'var(--font-mono)' }}>Kumulatif {fmt(cumFlow.value ?? 0)}</p>}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function InvestorFlowCard({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useInvestorFlow(ticker);
  const cfg = data ? SIGNAL_CONFIG[data.signal] : null;

  // Build chart data with cumulative flow
  const chartData = data ? (() => {
    let cum = 0;
    return data.scorecard.map((s) => {
      cum += s.netFlow;
      return { date: shortDate(s.date), netFlow: s.netFlow, cumFlow: cum, buyPct: s.buyPct, daySignal: s.daySignal };
    });
  })() : [];

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Aliran Dana Investor</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Estimasi teknikal · bukan data asing/domestik IDX</p>
        </div>
        <button onClick={() => refetch()} title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', borderRadius: 6 }}>
          <RefreshCw size={14} strokeWidth={2} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {isLoading && <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</div>}
      {isError && <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Data tidak tersedia untuk saham ini.</div>}

      {data && cfg && (
        <>
          {/* ── Signal badge + narrative ── */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                <InfoTooltip content={TIPS.signal} size={11} />
              </div>
              {/* Score bar */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[-4,-3,-2,-1,0,1,2,3,4].map((lvl) => {
                    const active = data.score >= 0 ? lvl >= 1 && lvl <= data.score : lvl <= -1 && lvl >= data.score;
                    const col = data.score > 0 ? 'var(--gain-400)' : data.score < 0 ? 'var(--loss-400)' : 'var(--border-subtle)';
                    return (
                      <div key={lvl} style={{
                        flex: 1, height: 5, borderRadius: 2,
                        background: active ? col : 'var(--bg-raised)',
                        opacity: active ? 1 : 0.4,
                      }} />
                    );
                  })}
                </div>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>Kekuatan sinyal</p>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gain-400)' }}>{data.accDays}▲</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--loss-400)' }}>{data.distDays}▼</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 10 sesi</span>
              </div>
            </div>

            {/* Narrative bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.narrative.map((n, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>·</span>{n}
                </p>
              ))}
            </div>
          </div>

          {/* ── 3 indicator gauges ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-dim)' }}>
            {/* CMF */}
            <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CMF</span>
                  <InfoTooltip content={TIPS.cmf} size={10} />
                </div>
                <TrendIcon trend={data.cmfTrend} />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, margin: '0 0 6px 0', color: data.latestCmf >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                {data.latestCmf >= 0 ? '+' : ''}{(data.latestCmf * 100).toFixed(1)}
              </p>
              <GaugeBar value={data.latestCmf} min={-0.5} max={0.5}
                zones={[
                  { from: -0.5, to: -0.15, color: 'var(--loss-400)' },
                  { from: -0.15, to: 0.15, color: 'var(--text-muted)' },
                  { from: 0.15, to: 0.5,  color: 'var(--gain-400)' },
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>−50</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>0</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>+50</span>
              </div>
            </div>

            {/* MFI */}
            <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MFI</span>
                  <InfoTooltip content={TIPS.mfi} size={10} />
                </div>
                <span style={{ fontSize: 9, color: data.latestMfi > 70 ? 'var(--warn-400)' : data.latestMfi < 30 ? 'var(--blue-300)' : 'var(--text-muted)' }}>
                  {data.latestMfi > 70 ? 'Jenuh Beli' : data.latestMfi < 30 ? 'Jenuh Jual' : 'Normal'}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, margin: '0 0 6px 0', color: data.latestMfi > 70 ? 'var(--warn-400)' : data.latestMfi < 30 ? 'var(--blue-300)' : 'var(--text-primary)' }}>
                {data.latestMfi.toFixed(0)}
              </p>
              <GaugeBar value={data.latestMfi} min={0} max={100}
                zones={[
                  { from: 0,  to: 30,  color: 'var(--blue-400)' },
                  { from: 30, to: 70,  color: 'var(--text-muted)' },
                  { from: 70, to: 100, color: 'var(--warn-400)' },
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>0</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>50</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>100</span>
              </div>
            </div>

            {/* OBV + Tekanan Beli */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OBV</span>
                  <InfoTooltip content={TIPS.obv} size={10} />
                </div>
                <TrendIcon trend={data.obvTrend} />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, margin: '0 0 3px 0', color: data.obvTrend === 'rising' ? 'var(--gain-400)' : data.obvTrend === 'falling' ? 'var(--loss-400)' : 'var(--text-primary)' }}>
                {data.obvTrend === 'rising' ? '+' : data.obvTrend === 'falling' ? '−' : '±'}{Math.abs(data.obvChangePct).toFixed(1)}%
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>5 sesi terakhir</p>
              <GaugeBar value={data.latestBuyPct} min={0} max={100}
                zones={[
                  { from: 0,  to: 40,  color: 'var(--loss-400)' },
                  { from: 40, to: 60,  color: 'var(--text-muted)' },
                  { from: 60, to: 100, color: 'var(--gain-400)' },
                ]}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>Tekanan beli {data.latestBuyPct.toFixed(0)}%</p>
                <InfoTooltip content={TIPS.buyPct} size={9} />
              </div>
            </div>
          </div>

          {/* ── Net flow bar chart + cumulative line ── */}
          <div style={{ padding: '12px 16px 4px', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Net Aliran Dana · 10 Sesi
              </p>
              <InfoTooltip content={TIPS.netFlow} size={10} />
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<NetFlowTooltip />} />
                <ReferenceLine y={0} stroke="var(--border-default)" strokeWidth={1} />
                <Bar dataKey="netFlow" name="netFlow" radius={[3, 3, 0, 0]} maxBarSize={24}>
                  {chartData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.netFlow >= 0 ? 'var(--gain-400)' : 'var(--loss-400)'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
                <Line dataKey="cumFlow" name="cumFlow" type="monotone" stroke="var(--blue-300)"
                  strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--gain-400)', opacity: 0.7 }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Net beli</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--loss-400)', opacity: 0.7 }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Net jual</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 16, height: 1.5, background: 'var(--blue-300)' }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Kumulatif</span>
              </div>
            </div>
          </div>

          {/* ── 10-day scorecard table ── */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Scorecard 10 Sesi
              </p>
              <InfoTooltip content={TIPS.scorecard} size={10} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {['Tanggal', 'Close', 'Volume', 'Beli%', 'CMF', 'Signal'].map((h, i) => (
                      <th key={h} style={{ padding: '0 6px 6px', textAlign: i === 0 ? 'left' : 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.scorecard.map((row) => {
                    const signalColor = DAY_SIGNAL_COLOR[row.daySignal];
                    const rowBg = row.daySignal === 'accumulation' ? 'rgba(15,186,130,0.04)' : row.daySignal === 'distribution' ? 'rgba(240,71,106,0.04)' : 'transparent';
                    return (
                      <tr key={row.date} style={{ background: rowBg, borderTop: '1px solid var(--border-dim)' }}>
                        <td style={{ padding: '5px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{shortDate(row.date)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {row.close.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {fmt(row.volume)}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: row.buyPct > 55 ? 'var(--gain-400)' : row.buyPct < 45 ? 'var(--loss-400)' : 'var(--text-secondary)' }}>
                          {row.buyPct.toFixed(0)}%
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: (row.cmf ?? 0) >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                          {row.cmf !== null ? `${(row.cmf * 100).toFixed(1)}` : '—'}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: signalColor, fontWeight: 700 }}>
                          {DAY_SIGNAL_EMOJI[row.daySignal]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div style={{ padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Info size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Data dihitung dari harga &amp; volume harian (Yahoo Finance). CMF, MFI, dan OBV adalah proksi teknikal untuk aliran dana institusi — bukan data asing/domestik resmi IDX. Data IDX real-time memerlukan layanan berbayar.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
