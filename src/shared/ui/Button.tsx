import React from 'react';
import { cn } from '@/shared/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--blue-400)] text-white border-transparent shadow-[var(--glow-brand-xs)] hover:bg-[var(--blue-500)] hover:shadow-[var(--glow-brand-sm)] active:bg-[var(--blue-600)] active:scale-[0.97]',
  secondary: 'bg-[var(--bg-raised)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] active:scale-[0.97]',
  ghost:     'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] active:scale-[0.97]',
  danger:    'bg-[var(--loss-500)] text-white border-transparent shadow-[var(--glow-loss)] hover:bg-[var(--loss-600)] active:scale-[0.97]',
  accent:    'bg-[var(--blue-tint-2)] text-[var(--blue-300)] border-[rgba(77,124,255,0.22)] hover:bg-[rgba(77,124,255,0.2)] hover:border-[var(--blue-ring)] hover:text-[var(--blue-200)] active:scale-[0.97]',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-[10px] py-[5px] text-xs',
  sm: 'px-[14px] py-[7px] text-xs',
  md: 'px-5 py-[10px] text-sm',
  lg: 'px-[26px] py-[13px] text-base',
  xl: 'px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-[7px]',
        'border font-semibold rounded-md',
        'font-sans whitespace-nowrap select-none',
        'transition-[background,box-shadow,transform,border-color,color] duration-[150ms]',
        'outline-none focus-visible:shadow-[var(--ring-brand)]',
        'cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-40 cursor-not-allowed pointer-events-none shadow-none',
        loading && 'cursor-wait',
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-3 h-3 border-2 border-white/30 border-t-current rounded-full animate-spin flex-shrink-0" />
      )}
      {!loading && icon && <span className="inline-flex items-center flex-shrink-0">{icon}</span>}
      {children}
      {!loading && iconRight && <span className="inline-flex items-center flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
