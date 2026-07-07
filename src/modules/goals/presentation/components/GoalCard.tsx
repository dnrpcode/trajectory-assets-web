import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, CalendarDays, TrendingUp, Wallet } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { formatDate } from '@/shared/utils/formatDate';
import type { GoalProgress } from '../../domain/entities/Goal';

interface GoalCardProps {
  progress: GoalProgress;
  onEdit: () => void;
  onDelete: () => void;
}

type GoalStatus = 'achieved' | 'onTrack' | 'behind' | 'noDeadline';

const STATUS_STYLE: Record<GoalStatus, { color: string; bg: string }> = {
  achieved:   { color: 'var(--gain-400)', bg: 'var(--gain-tint)' },
  onTrack:    { color: 'var(--blue-400)', bg: 'var(--blue-tint)' },
  behind:     { color: 'var(--warn-400)', bg: 'var(--warn-tint)' },
  noDeadline: { color: 'var(--text-muted)', bg: 'var(--bg-raised)' },
};

function goalStatus(p: GoalProgress): GoalStatus {
  if (p.achieved) return 'achieved';
  if (p.onTrack === true) return 'onTrack';
  if (p.onTrack === false) return 'behind';
  return 'noDeadline';
}

export function GoalCard({ progress: p, onEdit, onDelete }: GoalCardProps) {
  const { t } = useTranslation();
  const status = goalStatus(p);
  const badge = STATUS_STYLE[status];
  const barPct = Math.min(100, p.progressPct);
  const barColor = p.achieved ? 'var(--gain-400)' : status === 'behind' ? 'var(--warn-400)' : 'var(--blue-400)';

  const metaRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 'var(--text-xs)',
  };

  return (
    <Card padding="md">
      {/* Header: nama + aksi */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3
            className="truncate"
            style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}
          >
            {p.goal.name || t('goals.defaultName')}
          </h3>
          {p.goal.description && (
            <p className="truncate mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              {p.goal.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg }}
          >
            {t(`goals.status.${status}`)}
          </span>
          <button
            onClick={onEdit}
            aria-label={t('common.edit')}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={t('common.delete')}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--loss-400)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {p.progressPct.toFixed(1)}%
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            {t('goals.card.ofTarget', { target: formatCurrency(p.goal.targetAmountIDR) })}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${barPct}%`, background: barColor }}
          />
        </div>
        {!p.achieved && (
          <p className="mt-2" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
            {t('goals.card.remaining', { amount: formatCurrency(p.remainingIDR) })}
          </p>
        )}
      </div>

      {/* Detail proyeksi */}
      <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {p.goal.targetDate && p.monthsRemaining !== null && (
          <div style={metaRow}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <CalendarDays size={12} /> {t('goals.card.deadline')}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {formatDate(p.goal.targetDate)} · {t('goals.card.monthsLeft', { count: p.monthsRemaining })}
            </span>
          </div>
        )}
        {p.projectedValueIDR !== null && !p.achieved && (
          <div style={metaRow}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp size={12} /> {t('goals.card.projected')}
            </span>
            <span style={{ color: p.onTrack ? 'var(--gain-400)' : 'var(--warn-400)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(p.projectedValueIDR)}
            </span>
          </div>
        )}
        {p.requiredMonthlyIDR !== null && p.requiredMonthlyIDR > 0 && !p.achieved && (
          <div style={metaRow}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Wallet size={12} /> {t('goals.card.requiredMonthly')}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(p.requiredMonthlyIDR)}
              {p.goal.monthlyContributionIDR
                ? ` · ${t('goals.card.plannedMonthly', { amount: formatCurrency(p.goal.monthlyContributionIDR) })}`
                : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
