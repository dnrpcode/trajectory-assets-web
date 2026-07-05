import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { SignalResult, SignalFactor } from '@/shared/utils/indicators';

interface Props {
  signal: SignalResult;
}

const VERDICT_STYLE = {
  bullish: { color: 'var(--gain-400)', bg: 'var(--gain-tint)', Icon: ArrowUpRight },
  bearish: { color: 'var(--loss-400)', bg: 'var(--loss-tint)', Icon: ArrowDownRight },
  neutral: { color: 'var(--text-muted)', bg: 'var(--bg-overlay)', Icon: Minus },
} as const;

function FactorRow({ factor }: { factor: SignalFactor }) {
  const { t } = useTranslation();
  const { color, bg, Icon } = VERDICT_STYLE[factor.verdict];
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, background: bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        <Icon size={12} strokeWidth={2.5} style={{ color }} />
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {t(`trading.factors.${factor.key}`, factor.params)}
      </p>
    </div>
  );
}

export function SignalAnalysisCard({ signal }: Props) {
  const { t } = useTranslation();
  const { score, confidence, factors } = signal;

  const scoreColor = score >= 30 ? 'var(--gain-500)' : score <= -30 ? 'var(--loss-500)' : 'var(--text-primary)';
  const confidenceKey = confidence === 'strong' ? 'confidenceStrong' : confidence === 'moderate' ? 'confidenceModerate' : 'confidenceWeak';
  const summaryKey = signal.signal === 'BUY' ? 'summaryBuy' : signal.signal === 'SELL' ? 'summarySell' : 'summaryHold';
  const scoreLabel = `${score >= 0 ? '+' : ''}${score}`;

  const bullishCount = factors.filter((f) => f.verdict === 'bullish').length;
  const bearishCount = factors.filter((f) => f.verdict === 'bearish').length;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          {t('trading.analysis.title')}
        </p>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {t('trading.analysis.confidence')}:{' '}
          <span style={{ color: confidence === 'strong' ? scoreColor : 'var(--text-secondary)' }}>
            {t(`trading.analysis.${confidenceKey}`)}
          </span>
        </span>
      </div>

      {/* Score gauge */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('trading.analysis.score')}</span>
          <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: scoreColor }}>{scoreLabel}</span>
        </div>
        <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'linear-gradient(90deg, var(--loss-500), var(--bg-overlay) 42%, var(--bg-overlay) 58%, var(--gain-500))' }}>
          <div style={{
            position: 'absolute', top: -3, bottom: -3, width: 3, borderRadius: 2,
            left: `calc(${(score + 100) / 2}% - 1.5px)`,
            background: 'var(--text-primary)', boxShadow: '0 0 0 2px var(--bg-surface)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--loss-400)' }}>−100</span>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>0</span>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--gain-400)' }}>+100</span>
        </div>
      </div>

      {/* Bullish/bearish tally */}
      <div style={{ display: 'flex', gap: 6, margin: '10px 0 12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--gain-tint)', color: 'var(--gain-400)' }}>
          {bullishCount} {t('trading.analysis.bullish')}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--loss-tint)', color: 'var(--loss-400)' }}>
          {bearishCount} {t('trading.analysis.bearish')}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
          {factors.length - bullishCount - bearishCount} {t('trading.analysis.neutral')}
        </span>
      </div>

      {/* Factor list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        {factors.map((f) => <FactorRow key={f.key} factor={f} />)}
      </div>

      {/* Summary */}
      <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}>
        {t(`trading.analysis.${summaryKey}`, { score: scoreLabel })}
      </p>
    </div>
  );
}
