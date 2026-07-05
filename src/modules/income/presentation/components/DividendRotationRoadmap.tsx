import { useTranslation } from 'react-i18next';
import { Route, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatPercent } from '@/shared/utils/formatCurrency';
import type { RotationRoadmap, RotationConfidence } from '../../domain/entities/DividendRotation';

const MONTH_SHORT: Record<string, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function confidenceStyle(confidence: RotationConfidence) {
  if (confidence === 'high') return { color: 'var(--gain-400)', bg: 'var(--gain-tint)' };
  if (confidence === 'medium') return { color: 'var(--warn-400)', bg: 'var(--warn-tint)' };
  return { color: 'var(--loss-400)', bg: 'var(--loss-tint)' };
}

interface DividendRotationRoadmapProps {
  roadmap: RotationRoadmap | null;
}

export function DividendRotationRoadmap({ roadmap }: DividendRotationRoadmapProps) {
  const { t, i18n } = useTranslation();
  const months = MONTH_SHORT[i18n.language] ?? MONTH_SHORT.id;

  return (
    <div
      className="rounded-[var(--card-radius)] p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Route size={18} style={{ color: 'var(--blue-400)' }} />
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          {t('income.rotation.title')}
        </h2>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        {t('income.rotation.subtitle')}
      </p>

      <div
        className="flex items-start gap-2 rounded-md p-2.5 mb-4"
        style={{ background: 'var(--warn-tint)', border: '1px solid var(--border-dim)' }}
      >
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warn-400)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {t('income.rotation.disclaimer')}
        </p>
      </div>

      {!roadmap || roadmap.windows.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {t('income.rotation.emptyState')}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {roadmap.windows.map((w, i) => {
              const conf = confidenceStyle(w.confidence);
              return (
                <div
                  key={`${w.ticker}-${w.monthIndex}`}
                  className="rounded-md p-3"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--blue-tint-2)', color: 'var(--blue-300)' }}
                      >
                        {t('income.rotation.moveNumber', { n: i + 1 })}
                      </span>
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {w.ticker}
                      </span>
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{w.name}</span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: conf.bg, color: conf.color, letterSpacing: 'var(--tracking-caps)' }}
                    >
                      {t('income.rotation.confidence')}: {t(`income.rotation.confidence${w.confidence.charAt(0).toUpperCase()}${w.confidence.slice(1)}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('income.rotation.period')}</p>
                      <p className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        {months[w.entryDate.getMonth()]} - {months[w.exitDate.getMonth()]}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('income.rotation.expectedYield')}</p>
                      <p className="font-mono" style={{ color: 'var(--gain-400)' }}>{formatPercent(w.expectedDividendYieldPct)}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('income.rotation.expectedPriceReturn')}</p>
                      <p className="font-mono" style={{ color: w.expectedPriceReturnPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                        {formatPercent(w.expectedPriceReturnPct)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('income.rotation.expectedTotalReturn')}</p>
                      <p className="font-mono font-semibold" style={{ color: w.expectedTotalReturnPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                        {formatPercent(w.expectedTotalReturnPct)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {t('income.rotation.occurrences', { n: w.occurrences, total: w.yearsChecked })}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t('income.rotation.totalRoadmapReturn')}
            </span>
            <span
              className="font-mono font-bold text-sm"
              style={{ color: roadmap.totalExpectedReturnPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}
            >
              {formatPercent(roadmap.totalExpectedReturnPct)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
