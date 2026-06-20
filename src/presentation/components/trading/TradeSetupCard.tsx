import { useState } from 'react';
import { Copy, Check, Info, AlertTriangle } from 'lucide-react';
import { SignalResult, TradingSignal } from '../../../shared/utils/indicators';

interface Props {
  signal: SignalResult;
  currentPriceUSD: number;
  usdToIdr: number;
  symbol: string;
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50];

function suggestLeverage(signal: TradingSignal, rsi: number): number {
  if (signal === 'HOLD') return 1;
  const strength = signal === 'BUY' ? (30 - rsi) : (rsi - 70);
  if (strength > 15) return 5;
  if (strength > 5) return 3;
  return 2;
}

function suggestSlPct(leverage: number): number {
  // Tighter SL for higher leverage to control risk
  if (leverage >= 20) return 1.5;
  if (leverage >= 10) return 2.5;
  if (leverage >= 5) return 3.5;
  if (leverage >= 3) return 5;
  return 7;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--gain-500)' : 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}
    >
      {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
    </button>
  );
}

function PriceRow({ label, value, valueColor, subValue, copyValue, highlight }: {
  label: string;
  value: string;
  valueColor?: string;
  subValue?: string;
  copyValue?: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      background: highlight ? 'var(--blue-tint)' : 'var(--bg-raised)',
      borderRadius: 8,
      border: highlight ? '1px solid rgba(77,124,255,0.2)' : '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: valueColor ?? 'var(--text-primary)' }}>
            {value}
          </span>
          {subValue && <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>{subValue}</p>}
        </div>
        {copyValue && <CopyButton value={copyValue} />}
      </div>
    </div>
  );
}

export function TradeSetupCard({ signal, currentPriceUSD, usdToIdr }: Props) {
  const defaultLev = suggestLeverage(signal.signal, signal.rsi);
  const [leverage, setLeverage] = useState(defaultLev);

  const isBuy = signal.signal === 'BUY';
  const isSell = signal.signal === 'SELL';
  const isHold = signal.signal === 'HOLD';

  const entry = currentPriceUSD;
  const slPct = suggestSlPct(leverage);
  const tpPct = slPct * 2; // 2:1 risk/reward

  const stopLoss = isBuy
    ? entry * (1 - slPct / 100)
    : isSell
      ? entry * (1 + slPct / 100)
      : null;

  const takeProfit = isBuy
    ? entry * (1 + tpPct / 100)
    : isSell
      ? entry * (1 - tpPct / 100)
      : null;

  // Liquidation price (simplified: for isolated margin)
  const liquidation = leverage > 1
    ? isBuy
      ? entry * (1 - 1 / leverage * 0.9)
      : isSell
        ? entry * (1 + 1 / leverage * 0.9)
        : null
    : null;

  const fmtUSD = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 6 : 2 })}`;
  const fmtIDR = (v: number) => {
    const idr = v * usdToIdr;
    return `≈ Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Rekomendasi Setup Trade
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
          Berdasarkan sinyal RSI + MA · R:R 1:2
        </p>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Leverage selector */}
        <div style={{ marginBottom: 4 }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leverage
          </p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                style={{
                  padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-mono)',
                  transition: 'all 150ms',
                  background: leverage === lev ? 'var(--blue-500)' : 'var(--bg-raised)',
                  color: leverage === lev ? '#fff' : 'var(--text-secondary)',
                  outline: leverage === lev ? '2px solid var(--blue-400)' : 'none',
                }}
              >
                {lev}×
              </button>
            ))}
          </div>
          {leverage === defaultLev && (
            <p style={{ margin: '5px 0 0', fontSize: '10px', color: 'var(--blue-400)' }}>
              ✦ Disarankan berdasarkan kekuatan sinyal
            </p>
          )}
        </div>

        {/* Entry */}
        <PriceRow
          label="Entry"
          value={fmtUSD(entry)}
          subValue={fmtIDR(entry)}
          copyValue={entry.toFixed(6)}
          highlight
        />

        {/* Stop Loss */}
        {stopLoss && (
          <PriceRow
            label={`Stop Loss (−${slPct}%)`}
            value={fmtUSD(stopLoss)}
            valueColor="var(--loss-500)"
            subValue={fmtIDR(stopLoss)}
            copyValue={stopLoss.toFixed(6)}
          />
        )}

        {/* Take Profit */}
        {takeProfit && (
          <PriceRow
            label={`Take Profit (+${tpPct}%)`}
            value={fmtUSD(takeProfit)}
            valueColor="var(--gain-500)"
            subValue={fmtIDR(takeProfit)}
            copyValue={takeProfit.toFixed(6)}
          />
        )}

        {/* Liquidation */}
        {liquidation && leverage > 1 && (
          <PriceRow
            label={`Likuidasi (${leverage}×)`}
            value={fmtUSD(liquidation)}
            valueColor="var(--warn-400)"
            subValue="⚠ Hindari menyentuh harga ini"
            copyValue={liquidation.toFixed(6)}
          />
        )}

        {/* R:R summary */}
        {!isHold && stopLoss && takeProfit && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, padding: '8px 10px', background: 'var(--loss-tint)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--loss-500)22' }}>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MAX LOSS</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--loss-500)' }}>−{(slPct * leverage).toFixed(0)}%</p>
              <p style={{ margin: '1px 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>dari modal</p>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: 'var(--gain-tint)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--gain-500)22' }}>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MAX GAIN</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--gain-500)' }}>+{(tpPct * leverage).toFixed(0)}%</p>
              <p style={{ margin: '1px 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>dari modal</p>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-raised)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>R:R</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--blue-400)' }}>1:2</p>
              <p style={{ margin: '1px 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>risk/reward</p>
            </div>
          </div>
        )}

        {isHold && (
          <div style={{ padding: '12px', background: 'var(--bg-overlay)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={14} style={{ color: 'var(--warn-400)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sinyal belum cukup kuat. Tunggu konfirmasi RSI atau MA crossover sebelum entry.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <Info size={11} style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Ini bukan saran keuangan. Eksekusi di exchange masing-masing. Gunakan leverage dengan bijak — semakin tinggi leverage, semakin besar risiko likuidasi.
          </p>
        </div>
      </div>
    </div>
  );
}
