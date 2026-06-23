import { RefreshCw, TrendingUp, TrendingDown, Globe, Users, Building2 } from 'lucide-react';
import { useInvestorFlow } from '../hooks/useInvestorFlow';

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function OwnershipBar({ institutionPct, insiderPct, retailPct }: { institutionPct: number; insiderPct: number; retailPct: number }) {
  const segments = [
    { label: 'Asing/Institusi', pct: institutionPct, color: 'var(--blue-400)' },
    { label: 'Emiten/Insider', pct: insiderPct, color: 'var(--warn-400)' },
    { label: 'Publik/Ritel', pct: retailPct, color: 'rgba(71,85,105,0.6)' },
  ];

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 10 }}>
        Komposisi Kepemilikan
      </p>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1, marginBottom: 10 }}>
        {segments.map((s) => (
          <div key={s.label} title={`${s.label}: ${pct(s.pct)}`}
            style={{ width: `${s.pct}%`, background: s.color, minWidth: s.pct > 0.5 ? 2 : 0 }} />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{pct(s.pct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatRow({ icon, label, pct: pctVal, sub }: { icon: React.ReactNode; label: string; pct: number; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-dim)' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{sub}</p>}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', flexShrink: 0 }}>
        {pct(pctVal)}
      </span>
    </div>
  );
}

function HoldersTable({ holders }: { holders: ReturnType<typeof useInvestorFlow>['data'] extends infer D ? D extends { topHolders: infer H } ? H : never : never }) {
  if (!holders || (holders as unknown[]).length === 0) return null;
  const list = holders as { name: string; reportDate: string; pctHeld: number; pctChange: number; position: number }[];

  return (
    <div style={{ padding: '12px 16px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 10 }}>
        Pemegang Institusi Terbesar
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map((h) => {
          const isUp = h.pctChange >= 0;
          return (
            <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-raised)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{h.reportDate} · {(h.position / 1_000_000).toFixed(0)}jt lembar</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{pct(h.pctHeld)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                  {isUp
                    ? <TrendingUp size={10} strokeWidth={2.5} style={{ color: 'var(--gain-400)' }} />
                    : <TrendingDown size={10} strokeWidth={2.5} style={{ color: 'var(--loss-400)' }} />
                  }
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isUp ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                    {isUp ? '+' : ''}{h.pctChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InvestorFlowCard({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useInvestorFlow(ticker);

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Struktur & Aliran Kepemilikan</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Asing · Emiten · Ritel · Sumber: Yahoo Finance</p>
        </div>
        <button onClick={() => refetch()} title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', borderRadius: 6 }}>
          <RefreshCw size={14} strokeWidth={2} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {isLoading && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data kepemilikan…</div>
      )}

      {isError && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>Data kepemilikan tidak tersedia</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>Saham ini mungkin tidak terdaftar di Yahoo Finance atau data belum tersedia.</p>
        </div>
      )}

      {data && (
        <>
          <OwnershipBar
            institutionPct={data.institution.pct}
            insiderPct={data.insider.pct}
            retailPct={data.retail.pct}
          />
          <StatRow
            icon={<Globe size={14} strokeWidth={2} style={{ color: 'var(--blue-400)' }} />}
            label="Asing / Institusi"
            pct={data.institution.pct}
            sub={`${data.institution.count} institusi tercatat`}
          />
          <StatRow
            icon={<Building2 size={14} strokeWidth={2} style={{ color: 'var(--warn-400)' }} />}
            label="Emiten / Insider"
            pct={data.insider.pct}
          />
          <StatRow
            icon={<Users size={14} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />}
            label="Publik / Ritel"
            pct={data.retail.pct}
            sub="estimasi dari sisa float"
          />
          <HoldersTable holders={data.topHolders} />
          <div style={{ padding: '8px 16px 10px', borderTop: '1px solid var(--border-dim)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Data kepemilikan bersifat kuartalan. Perubahan (↑↓) per institusi mencerminkan selisih posisi dari periode sebelumnya.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
