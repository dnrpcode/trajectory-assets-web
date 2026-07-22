import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';
import { useSignalBacktest } from '../hooks/useTrading';

interface Props {
  coinId: string;
}

const HOLDING_OPTIONS = [3, 7, 14] as const;

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', flex: 1 }}>
      <p style={{ margin: 0, fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

export function BacktestPanel({ coinId }: Props) {
  const { t } = useTranslation();
  const [holdingDays, setHoldingDays] = useState<number>(7);
  const { data, isLoading, isError } = useSignalBacktest(coinId, holdingDays);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FlaskConical size={14} style={{ color: 'var(--ai-accent)' }} />
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            {t('trading.backtest.title')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {HOLDING_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setHoldingDays(d)}
              style={{
                padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                background: holdingDays === d ? 'var(--ai-accent)' : 'var(--bg-raised)',
                color: holdingDays === d ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t('trading.backtest.days', { count: d })}
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: '10px', color: 'var(--text-muted)' }}>
        {t('trading.backtest.subtitle')}
      </p>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><Spinner size="sm" /></div>
      )}

      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px', background: 'var(--warn-tint)', borderRadius: 8 }}>
          <AlertTriangle size={13} style={{ color: 'var(--warn-400)', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--warn-400)' }}>{t('trading.backtest.error')}</span>
        </div>
      )}

      {data && !isLoading && (
        data.totalTrades === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            {t('trading.backtest.noTrades')}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <StatChip
                label={t('trading.backtest.winRate')}
                value={`${data.winRatePct}%`}
                color={data.winRatePct >= 50 ? 'var(--gain-400)' : 'var(--warn-400)'}
              />
              <StatChip
                label={t('trading.backtest.avgReturn')}
                value={`${data.avgReturnPct >= 0 ? '+' : ''}${data.avgReturnPct}%`}
                color={data.avgReturnPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)'}
              />
              <StatChip label={t('trading.backtest.trades')} value={String(data.totalTrades)} />
              <StatChip label={t('trading.backtest.maxDrawdown')} value={`-${data.maxDrawdownPct}%`} color="var(--loss-400)" />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: '10px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={11} style={{ color: 'var(--gain-400)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('trading.backtest.sideStat', { side: 'BUY', count: data.buy.count, winRate: data.buy.winRatePct })}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingDown size={11} style={{ color: 'var(--loss-400)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {t('trading.backtest.sideStat', { side: 'SELL', count: data.sell.count, winRate: data.sell.winRatePct })}
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              {t('trading.backtest.disclaimer', { days: data.daysAnalyzed })}
            </p>
          </>
        )
      )}
    </div>
  );
}
