import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SignalResult } from '@/shared/utils/indicators';

interface Props {
  signal: SignalResult;
  currentPriceUSD: number;
  usdToIdr: number;
  closes: number[];
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50];

type LeverageSuggestion =
  | { value: 1; reasonKey: 'unclear' }
  | { value: 5 | 3; reasonKey: 'strong' | 'moderate'; scoreLabel: string; aligned: number };

function suggestLeverage(signal: SignalResult): LeverageSuggestion {
  if (signal.signal === 'HOLD') return { value: 1, reasonKey: 'unclear' };
  const aligned = signal.factors.filter((f) =>
    signal.signal === 'BUY' ? f.verdict === 'bullish' : f.verdict === 'bearish',
  ).length;
  const scoreLabel = `${signal.score >= 0 ? '+' : ''}${signal.score}`;
  if (signal.confidence === 'strong') {
    return { value: 5, reasonKey: 'strong', scoreLabel, aligned };
  }
  return { value: 3, reasonKey: 'moderate', scoreLabel, aligned };
}

// Swing SL: pakai low/high 20 candle terakhir
function computeSwingSL(closes: number[], isBuy: boolean, entry: number): number {
  const recent = closes.slice(-20);
  if (isBuy) {
    const swingLow = Math.min(...recent);
    const sl = swingLow * 0.995; // buffer 0.5% di bawah swing low
    // Jangan terlalu jauh dari entry (max 15%)
    return Math.max(sl, entry * 0.85);
  } else {
    const swingHigh = Math.max(...recent);
    const sl = swingHigh * 1.005;
    return Math.min(sl, entry * 1.15);
  }
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--gain-500)' : 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
    </button>
  );
}

function PriceRow({ label, badge, value, subValue, copyValue, color, highlight, dimmed }: {
  label: string; badge?: string; value: string; subValue?: string;
  copyValue?: string; color?: string; highlight?: boolean; dimmed?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 12px',
      background: highlight ? 'rgba(77,124,255,0.06)' : 'var(--bg-raised)',
      borderRadius: 8,
      border: highlight ? '1px solid rgba(77,124,255,0.25)' : '1px solid var(--border-subtle)',
      opacity: dimmed ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        {badge && (
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: color ? color + '22' : 'var(--bg-overlay)', color: color ?? 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text-primary)' }}>
            {value}
          </span>
          {subValue && <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>{subValue}</p>}
        </div>
        {copyValue && <CopyButton value={copyValue} />}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, padding: '8px 6px', background: 'var(--bg-raised)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
      <p style={{ margin: 0, fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</p>
    </div>
  );
}

export function TradeSetupCard({ signal, currentPriceUSD, usdToIdr, closes }: Props) {
  const { t } = useTranslation();
  const suggested = suggestLeverage(signal);
  const suggestedReason = suggested.reasonKey === 'unclear'
    ? t('trading.setup.leverageUnclear')
    : t(`trading.setup.leverage${suggested.reasonKey === 'strong' ? 'Strong' : 'Moderate'}`, { score: suggested.scoreLabel, aligned: suggested.aligned });
  const [leverage, setLeverage] = useState<number>(suggested.value);
  const [showLimit, setShowLimit] = useState(false);

  const isBuy  = signal.signal === 'BUY';
  const isSell = signal.signal === 'SELL';
  const isHold = signal.signal === 'HOLD';

  const fmtUSD = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 6 : 2 })}`;
  const fmtIDR = (v: number) => `≈ Rp ${(v * usdToIdr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  // Entry prices
  const marketEntry = currentPriceUSD;
  const limitEntry  = isBuy
    ? currentPriceUSD * 0.992   // 0.8% di bawah untuk limit buy
    : currentPriceUSD * 1.008;  // 0.8% di atas untuk limit sell

  const entry = showLimit ? limitEntry : marketEntry;

  // Swing-based SL
  const swingSL = closes.length >= 20 ? computeSwingSL(closes, isBuy, entry) : null;
  const slPct   = swingSL ? Math.abs((entry - swingSL) / entry) * 100 : (leverage >= 20 ? 1.5 : leverage >= 10 ? 2.5 : leverage >= 5 ? 3.5 : leverage >= 3 ? 5 : 7);
  const stopLoss = swingSL ?? (isBuy ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100));

  // 3 TP levels (1:1, 1:2, 1:3)
  const slDist = Math.abs(entry - stopLoss);
  const tp1 = isBuy ? entry + slDist * 1 : entry - slDist * 1;
  const tp2 = isBuy ? entry + slDist * 2 : entry - slDist * 2;
  const tp3 = isBuy ? entry + slDist * 3 : entry - slDist * 3;

  // Liquidation
  const liq = leverage > 1
    ? isBuy  ? entry * (1 - (1 / leverage) * 0.9)
    : isSell ? entry * (1 + (1 / leverage) * 0.9)
    : null
    : null;

  const maxLossPct  = (slPct * leverage).toFixed(0);
  const maxGain1Pct = (slPct * 1 * leverage).toFixed(0);
  const maxGain2Pct = (slPct * 2 * leverage).toFixed(0);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            {t('trading.setup.title')}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            {t('trading.setup.subtitle')}
          </p>
        </div>
        {/* Market / Limit toggle */}
        {!isHold && (
          <div style={{ display: 'flex', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 2, gap: 2 }}>
            {(['Market', 'Limit'] as const).map((mode) => {
              const active = (mode === 'Market') === !showLimit;
              return (
                <button key={mode} onClick={() => setShowLimit(mode === 'Limit')} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)',
                  background: active ? 'var(--blue-500)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  transition: 'all 120ms',
                }}>
                  {mode}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {isHold ? (
          <div style={{ padding: '14px', background: 'var(--bg-overlay)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} style={{ color: 'var(--warn-400)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('trading.setup.holdTitle')}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t('trading.setup.holdDesc', { score: `${signal.score >= 0 ? '+' : ''}${signal.score}` })}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Leverage */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('trading.setup.leverage')}</p>
                <span style={{ fontSize: '10px', color: 'var(--blue-400)', fontWeight: 600 }}>
                  {leverage === suggested.value ? `✦ ${t('trading.setup.recommended')}` : t('trading.setup.recommendedValue', { value: suggested.value })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                {LEVERAGE_OPTIONS.map((lev) => (
                  <button key={lev} onClick={() => setLeverage(lev)} style={{
                    padding: '5px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-mono)',
                    transition: 'all 120ms',
                    background: leverage === lev ? 'var(--blue-500)' : 'var(--bg-raised)',
                    color: leverage === lev ? '#fff' : lev === suggested.value ? 'var(--blue-400)' : 'var(--text-secondary)',
                    outline: lev === suggested.value ? '1.5px solid var(--blue-400)' : 'none',
                    outlineOffset: '1px',
                  }}>{lev}×</button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{suggestedReason}</p>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Entry */}
            <PriceRow
              label={showLimit ? t('trading.setup.entryLimit') : t('trading.setup.entryMarket')}
              badge={showLimit ? 'limit' : 'market'}
              color="var(--blue-400)"
              value={fmtUSD(entry)}
              subValue={fmtIDR(entry)}
              copyValue={entry.toFixed(entry < 1 ? 6 : 2)}
              highlight
            />

            {showLimit && (
              <p style={{ margin: '-4px 0 0', fontSize: '10px', color: 'var(--text-muted)', paddingLeft: 2 }}>
                {t('trading.setup.limitDiff', { pct: fmtPct(((entry - marketEntry) / marketEntry) * 100) })}
              </p>
            )}

            {/* Stop Loss */}
            <PriceRow
              label={t('trading.setup.stopLoss')}
              badge={`−${slPct.toFixed(1)}%`}
              color="var(--loss-500)"
              value={fmtUSD(stopLoss)}
              subValue={closes.length >= 20 ? t('trading.setup.swingBased') : fmtIDR(stopLoss)}
              copyValue={stopLoss.toFixed(stopLoss < 1 ? 6 : 2)}
            />

            {/* TP levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <PriceRow
                label={t('trading.setup.takeProfit', { n: 1 })}
                badge="R:R 1:1"
                color="var(--gain-400)"
                value={fmtUSD(tp1)}
                subValue={fmtPct(((tp1 - entry) / entry) * 100 * (isBuy ? 1 : -1))}
                copyValue={tp1.toFixed(tp1 < 1 ? 6 : 2)}
              />
              <PriceRow
                label={t('trading.setup.takeProfit', { n: 2 })}
                badge="R:R 1:2"
                color="var(--gain-500)"
                value={fmtUSD(tp2)}
                subValue={fmtPct(((tp2 - entry) / entry) * 100 * (isBuy ? 1 : -1))}
                copyValue={tp2.toFixed(tp2 < 1 ? 6 : 2)}
              />
              <PriceRow
                label={t('trading.setup.takeProfit', { n: 3 })}
                badge="R:R 1:3"
                color="#4ade80"
                value={fmtUSD(tp3)}
                subValue={fmtPct(((tp3 - entry) / entry) * 100 * (isBuy ? 1 : -1))}
                copyValue={tp3.toFixed(tp3 < 1 ? 6 : 2)}
              />
            </div>

            {/* Liquidation */}
            {liq && leverage > 1 && (
              <PriceRow
                label={t('trading.setup.liquidation', { leverage })}
                badge="danger"
                color="var(--warn-400)"
                value={fmtUSD(liq)}
                subValue={`⚠ ${t('trading.setup.avoidTouching')}`}
                copyValue={liq.toFixed(liq < 1 ? 6 : 2)}
              />
            )}

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
              <SummaryChip label={t('trading.setup.maxLoss')} value={`−${maxLossPct}%`} color="var(--loss-500)" />
              <SummaryChip label={t('trading.setup.tpGain', { n: 1 })} value={`+${maxGain1Pct}%`} color="var(--gain-400)" />
              <SummaryChip label={t('trading.setup.tpGain', { n: 2 })} value={`+${maxGain2Pct}%`} color="var(--gain-500)" />
            </div>

            {/* Expand/collapse price ladder hint */}
            <button
              onClick={() => setShowLimit((p) => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '11px', padding: '2px 0', fontFamily: 'var(--font-sans)' }}
            >
              {showLimit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showLimit ? t('trading.setup.useMarket') : t('trading.setup.viewLimit')}
            </button>
          </>
        )}

        {/* Disclaimer */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <Info size={10} style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('trading.setup.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
