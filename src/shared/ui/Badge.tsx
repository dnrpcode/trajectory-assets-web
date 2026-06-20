import React from 'react';
import { cn } from '@/shared/utils/cn';

type BadgeVariant = 'gain' | 'loss' | 'warn' | 'neutral' | 'accent' | 'stale' | 'closed' | 'ai' | 'new';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  gain:    { background: 'var(--gain-tint)',           color: 'var(--gain-400)',    border: '1px solid rgba(15,186,130,0.22)' },
  loss:    { background: 'var(--loss-tint)',           color: 'var(--loss-400)',    border: '1px solid rgba(240,71,106,0.22)' },
  warn:    { background: 'var(--warn-tint)',           color: 'var(--warn-400)',    border: '1px solid rgba(245,158,11,0.2)' },
  neutral: { background: 'rgba(71,85,105,0.15)',      color: 'var(--neutral-300)', border: '1px solid rgba(71,85,105,0.2)' },
  accent:  { background: 'var(--blue-tint)',          color: 'var(--blue-300)',    border: '1px solid rgba(77,124,255,0.2)' },
  stale:   { background: 'rgba(245,158,11,0.08)',     color: 'var(--warn-400)',    border: '1px solid rgba(245,158,11,0.15)' },
  closed:  { background: 'rgba(46,64,89,0.25)',       color: 'var(--text-muted)',  border: '1px solid var(--border-dim)' },
  ai:      { background: 'rgba(167,139,250,0.1)',     color: 'var(--ai-accent)',   border: '1px solid rgba(167,139,250,0.2)' },
  new:     { background: 'rgba(77,124,255,0.12)',     color: 'var(--blue-300)',    border: '1px solid rgba(77,124,255,0.25)' },
};

const dotColors: Record<BadgeVariant, string> = {
  gain: 'var(--gain-400)', loss: 'var(--loss-400)', warn: 'var(--warn-400)',
  neutral: 'var(--neutral-300)', accent: 'var(--blue-300)', stale: 'var(--warn-400)',
  closed: 'var(--text-muted)', ai: 'var(--ai-accent)', new: 'var(--blue-300)',
};

export function Badge({ variant = 'neutral', size = 'sm', dot = false, children, className }: BadgeProps) {
  const isLg = size === 'md';
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full whitespace-nowrap font-sans uppercase',
        isLg ? 'gap-[5px] px-[10px] py-1 text-[0.75rem]' : 'gap-1 px-[7px] py-[2px] text-[0.6875rem]',
        className,
      )}
      style={{ ...variantStyles[variant], letterSpacing: 'var(--tracking-caps)', lineHeight: '1.4' }}
    >
      {dot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: isLg ? '6px' : '5px', height: isLg ? '6px' : '5px', background: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}
