import React from 'react';
import { cn } from '@/shared/utils/cn';

type CardVariant = 'default' | 'elevated' | 'accent' | 'glass';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:  'bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)]',
  elevated: 'bg-[var(--bg-raised)] border border-[var(--border-default)] shadow-md hover:border-[var(--border-strong)] hover:shadow-lg',
  accent:   'bg-[var(--bg-surface)] border border-[rgba(77,124,255,0.22)] shadow-[var(--glow-brand-xs)] hover:border-[rgba(77,124,255,0.4)] hover:shadow-[var(--glow-brand-sm)]',
  glass:    'bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-md backdrop-blur-[14px] hover:border-[var(--border-default)]',
};

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ variant = 'default', padding = 'md', hoverable = false, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--card-radius)]',
        'transition-[background,border-color,box-shadow] duration-[150ms]',
        variantClasses[variant],
        paddingClasses[padding],
        hoverable && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Compat helpers
export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-3 border-b border-[var(--border-subtle)]', className)}>{children}</div>;
}
