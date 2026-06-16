import React from 'react';
import { cn } from '@/shared/utils/cn';

interface StatCardProps {
  label: React.ReactNode;
  value: string | number;
  change?: number;
  changeLabel?: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent';
  mono?: boolean;
  valueSize?: string;
  className?: string;
}

export function StatCard({ label, value, change, changeLabel, prefix = '', suffix = '', icon, variant = 'default', mono = true, valueSize, className }: StatCardProps) {
  const isGain = typeof change === 'number' && change > 0;
  const isLoss = typeof change === 'number' && change < 0;

  const changeColor  = isGain ? 'var(--gain-400)'  : isLoss ? 'var(--loss-400)'  : 'var(--text-secondary)';
  const changeBg     = isGain ? 'var(--gain-tint)'  : isLoss ? 'var(--loss-tint)'  : 'rgba(46,64,89,0.2)';
  const changeBorder = isGain ? 'rgba(15,186,130,0.22)' : isLoss ? 'rgba(240,71,106,0.22)' : 'var(--border-dim)';
  const changeSign   = isGain ? '+' : '';

  return (
    <div
      className={cn('rounded-[var(--card-radius)] flex flex-col gap-[6px] font-sans', className)}
      style={{
        background: variant === 'accent' ? 'var(--blue-tint)' : 'var(--bg-surface)',
        border: `1px solid ${variant === 'accent' ? 'rgba(77,124,255,0.18)' : 'var(--border-subtle)'}`,
        padding: '16px 20px',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.75rem] font-semibold uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)', lineHeight: 1 }}>
          {label}
        </span>
        {icon && <span className="inline-flex items-center" style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div
        className="font-bold leading-[1.1]"
        style={{
          fontSize: valueSize || 'var(--text-2xl)',
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          letterSpacing: mono ? 'var(--tracking-tight)' : 'var(--tracking-snug)',
        }}
      >
        {prefix}{value}{suffix}
      </div>
      {change !== undefined && (
        <span
          className="inline-flex items-center gap-[3px] text-xs font-semibold font-mono rounded-full w-fit leading-[1.4]"
          style={{
            color: changeColor, background: changeBg,
            border: `1px solid ${changeBorder}`,
            padding: '2px 8px',
            letterSpacing: 'var(--tracking-mono)',
          }}
        >
          {changeLabel || `${changeSign}${change}%`}
        </span>
      )}
    </div>
  );
}
