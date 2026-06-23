import { RefreshCw, TrendingUp, TrendingDown, Users, Globe } from 'lucide-react';
import { useInvestorFlow } from '../hooks/useInvestorFlow';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';

function FlowRow({
  label,
  icon,
  buy,
  sell,
  net,
  total,
  accentColor,
}: {
  label: string;
  icon: React.ReactNode;
  buy: number;
  sell: number;
  net: number;
  total: number;
  accentColor: string;
}) {
  const isNetBuy = net >= 0;
  const buyPct  = total > 0 ? (buy  / total) * 100 : 0;
  const sellPct = total > 0 ? (sell / total) * 100 : 0;
  const absPct  = total > 0 ? (Math.abs(net) / total) * 100 : 0;

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-dim)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: accentColor }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isNetBuy
            ? <TrendingUp size={13} strokeWidth={2.5} style={{ color: 'var(--gain-400)' }} />
            : <TrendingDown size={13} strokeWidth={2.5} style={{ color: 'var(--loss-400)' }} />
          }
          <span style={{
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: isNetBuy ? 'var(--gain-400)' : 'var(--loss-400)',
          }}>
            {isNetBuy ? '+' : ''}{formatCurrencyCompact(net)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ({absPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Buy / sell bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Buy bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 22, flexShrink: 0, textAlign: 'right' }}>Beli</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(buyPct * 2, 100)}%`, height: '100%', borderRadius: 3, background: 'var(--gain-400)', opacity: 0.7 }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--gain-400)', width: 56, flexShrink: 0, textAlign: 'right' }}>
            {formatCurrencyCompact(buy)}
          </span>
        </div>
        {/* Sell bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 22, flexShrink: 0, textAlign: 'right' }}>Jual</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(sellPct * 2, 100)}%`, height: '100%', borderRadius: 3, background: 'var(--loss-400)', opacity: 0.7 }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--loss-400)', width: 56, flexShrink: 0, textAlign: 'right' }}>
            {formatCurrencyCompact(sell)}
          </span>
        </div>
      </div>

      {/* Net interpretation label */}
      <div style={{
        marginTop: 8, padding: '4px 8px', borderRadius: 6,
        background: isNetBuy ? 'rgba(15,186,130,0.06)' : 'rgba(240,71,106,0.06)',
        border: `1px solid ${isNetBuy ? 'rgba(15,186,130,0.15)' : 'rgba(240,71,106,0.15)'}`,
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ fontSize: 11, color: isNetBuy ? 'var(--gain-400)' : 'var(--loss-400)', fontWeight: 600 }}>
          {label} {isNetBuy ? 'net masuk' : 'net keluar'} {formatCurrencyCompact(Math.abs(net))}
        </span>
      </div>
    </div>
  );
}

function DominanceBar({ foreignBuy, domesticBuy }: { foreignBuy: number; domesticBuy: number }) {
  const total = foreignBuy + domesticBuy;
  if (total === 0) return null;
  const foreignPct = (foreignBuy / total) * 100;
  const domesticPct = 100 - foreignPct;

  return (
    <div style={{ padding: '10px 16px 12px' }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
        Proporsi Beli Hari Ini
      </p>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1 }}>
        <div style={{ width: `${foreignPct}%`, background: 'var(--blue-400)', borderRadius: '5px 0 0 5px', transition: 'width 600ms ease' }} title={`Asing ${foreignPct.toFixed(1)}%`} />
        <div style={{ flex: 1, background: 'var(--warn-400)', borderRadius: '0 5px 5px 0', opacity: 0.7 }} title={`Domestik ${domesticPct.toFixed(1)}%`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--blue-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          Asing {foreignPct.toFixed(1)}%
        </span>
        <span style={{ fontSize: 10, color: 'var(--warn-400)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          Domestik {domesticPct.toFixed(1)}%
        </span>
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
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Aliran Dana Investor</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Asing vs Domestik · Sumber: IDX</p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', borderRadius: 6 }}
          title="Refresh data"
        >
          <RefreshCw size={14} strokeWidth={2} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {isLoading && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Memuat data aliran dana…
        </div>
      )}

      {isError && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>Data aliran dana tidak tersedia</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
            Data IDX mungkin belum tersedia di luar jam bursa, atau ticker tidak ditemukan.
          </p>
        </div>
      )}

      {data && (
        <>
          <FlowRow
            label="Asing"
            icon={<Globe size={14} strokeWidth={2} />}
            buy={data.foreign.buy}
            sell={data.foreign.sell}
            net={data.foreign.net}
            total={data.total}
            accentColor="var(--blue-400)"
          />
          <FlowRow
            label="Domestik"
            icon={<Users size={14} strokeWidth={2} />}
            buy={data.domestic.buy}
            sell={data.domestic.sell}
            net={data.domestic.net}
            total={data.total}
            accentColor="var(--warn-400)"
          />
          <DominanceBar foreignBuy={data.foreign.buy} domesticBuy={data.domestic.buy} />
          <div style={{ padding: '6px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {data.date} · volume {(data.volume / 1_000_000).toFixed(1)}jt lot
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Delay ±15 mnt</span>
          </div>
        </>
      )}
    </div>
  );
}
