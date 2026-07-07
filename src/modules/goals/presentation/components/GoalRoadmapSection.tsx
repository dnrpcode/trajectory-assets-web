import React from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Lightbulb, CalendarDays } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { formatMonth, getMonthFromDate } from '@/shared/utils/formatDate';
import type { GoalRoadmap, GoalRoadmapItem, RoadmapAdvice } from '../../domain/entities/Goal';

function ItemStatusChip({ item }: { item: GoalRoadmapItem }) {
  const { t } = useTranslation();
  const p = item.progress;

  let label: string;
  let color: string;
  let bg: string;

  if (p.achieved) {
    label = t('goals.status.achieved');
    color = 'var(--gain-400)'; bg = 'var(--gain-tint)';
  } else if (item.estimatedMonths === null) {
    label = t('goals.roadmap.notReachable');
    color = 'var(--loss-400)'; bg = 'var(--loss-tint)';
  } else if (item.slackMonths === null) {
    label = t('goals.status.noDeadline');
    color = 'var(--text-muted)'; bg = 'var(--bg-raised)';
  } else if (item.slackMonths >= 0) {
    label = item.slackMonths > 0
      ? `${t('goals.status.onTrack')} · ${t('goals.roadmap.aheadBy', { count: item.slackMonths })}`
      : t('goals.status.onTrack');
    color = 'var(--gain-400)'; bg = 'var(--gain-tint)';
  } else {
    label = `${t('goals.status.behind')} · ${t('goals.roadmap.lateBy', { count: -item.slackMonths })}`;
    color = 'var(--warn-400)'; bg = 'var(--warn-tint)';
  }

  return (
    <span className="px-2 py-0.5 rounded-full whitespace-nowrap" style={{ fontSize: '11px', fontWeight: 600, color, background: bg }}>
      {label}
    </span>
  );
}

function adviceText(advice: RoadmapAdvice, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const name = advice.goalName || t('goals.defaultName');
  switch (advice.type) {
    case 'increaseTotal':
      return t('goals.advice.increaseTotal', {
        amount: formatCurrency(advice.amountIDR ?? 0),
        current: formatCurrency(advice.currentIDR ?? 0),
        name,
      });
    case 'allOnTrack':      return t('goals.advice.allOnTrack');
    case 'focusNext':       return t('goals.advice.focusNext', { name });
    case 'addContribution': return t('goals.advice.addContribution');
    case 'deadlinePassed':  return t('goals.advice.deadlinePassed', { name });
  }
}

export function GoalRoadmapSection({ roadmap }: { roadmap: GoalRoadmap }) {
  const { t } = useTranslation();
  const needsMore =
    roadmap.requiredMonthlyTotalIDR !== null &&
    roadmap.requiredMonthlyTotalIDR > roadmap.totalMonthlyContributionIDR;

  const statLabel: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase' };
  const statValue: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2 };

  return (
    <Card padding="md" className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <Route size={16} style={{ color: 'var(--blue-400)' }} />
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>
          {t('goals.roadmap.title')}
        </h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
        {t('goals.roadmap.subtitle')}
      </p>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-xl px-3.5 py-3" style={{ background: 'var(--bg-raised)' }}>
          <p style={statLabel}>{t('goals.roadmap.totalTarget')}</p>
          <p style={statValue}>{formatCurrencyCompact(roadmap.totalTargetIDR)}</p>
        </div>
        <div className="rounded-xl px-3.5 py-3" style={{ background: 'var(--bg-raised)' }}>
          <p style={statLabel}>{t('goals.roadmap.plannedMonthly')}</p>
          <p style={statValue}>{formatCurrencyCompact(roadmap.totalMonthlyContributionIDR)}{t('goals.roadmap.perMonth')}</p>
        </div>
        <div className="rounded-xl px-3.5 py-3" style={{ background: needsMore ? 'var(--warn-tint)' : 'var(--bg-raised)' }}>
          <p style={statLabel}>{t('goals.roadmap.requiredMonthly')}</p>
          <p style={{ ...statValue, color: needsMore ? 'var(--warn-400)' : 'var(--gain-400)' }}>
            {roadmap.requiredMonthlyTotalIDR !== null
              ? `${formatCurrencyCompact(roadmap.requiredMonthlyTotalIDR)}${t('goals.roadmap.perMonth')}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-5">
        {roadmap.items.map((item, idx) => {
          const p = item.progress;
          const isLast = idx === roadmap.items.length - 1;
          return (
            <div key={p.goal.id} className="flex gap-3.5">
              {/* Kolom nomor + garis penghubung */}
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: p.achieved ? 'var(--gain-tint)' : 'var(--blue-tint)',
                    color: p.achieved ? 'var(--gain-400)' : 'var(--blue-400)',
                    fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {item.order}
                </div>
                {!isLast && <div className="w-px flex-1 my-1" style={{ background: 'var(--border-subtle)' }} />}
              </div>

              {/* Isi */}
              <div className={isLast ? 'pb-1 min-w-0 flex-1' : 'pb-5 min-w-0 flex-1'}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {p.goal.name || t('goals.defaultName')}
                    </span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrencyCompact(p.goal.targetAmountIDR)}
                    </span>
                  </div>
                  <ItemStatusChip item={item} />
                </div>

                <div className="flex items-center gap-4 mt-1.5 flex-wrap" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  {item.order > 1 && (
                    <span>{t('goals.roadmap.cumulative', { amount: formatCurrencyCompact(item.cumulativeTargetIDR) })}</span>
                  )}
                  {p.goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {formatMonth(getMonthFromDate(p.goal.targetDate))}
                    </span>
                  )}
                  {!p.achieved && item.estimatedDate && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {t('goals.roadmap.estReached')}: <strong>{formatMonth(getMonthFromDate(item.estimatedDate))}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saran */}
      {roadmap.advices.length > 0 && (
        <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase' }}>
            {t('goals.roadmap.adviceTitle')}
          </p>
          {roadmap.advices.map((advice, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Lightbulb size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--warn-400)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>
                {adviceText(advice, t)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
