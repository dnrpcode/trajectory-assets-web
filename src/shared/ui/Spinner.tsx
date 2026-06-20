
import { cn } from '@/shared/utils/cn';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn('inline-block rounded-full animate-spin border-2 border-[var(--border-default)] border-t-[var(--blue-400)]', sizeClasses[size], className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Spinner size="lg" />
    </div>
  );
}
