import { TradingSignal } from '@/shared/utils/indicators';

interface Props {
  signal: TradingSignal;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  BUY:  { label: 'BUY',  bg: 'var(--gain-tint)',  color: 'var(--gain-500)',  border: 'var(--gain-500)' },
  SELL: { label: 'SELL', bg: 'var(--loss-tint)',  color: 'var(--loss-500)',  border: 'var(--loss-500)' },
  HOLD: { label: 'HOLD', bg: 'var(--bg-overlay)', color: 'var(--text-muted)', border: 'var(--border-default)' },
};

const SIZE = {
  sm: { fontSize: '10px', padding: '2px 7px', borderRadius: 6 },
  md: { fontSize: '11px', padding: '3px 10px', borderRadius: 7 },
  lg: { fontSize: '13px', padding: '5px 14px', borderRadius: 8 },
};

export function SignalBadge({ signal, size = 'md' }: Props) {
  const cfg = CONFIG[signal];
  const sz = SIZE[size];
  return (
    <span style={{
      ...sz,
      background: cfg.bg,
      color: cfg.color,
      border: `1.5px solid ${cfg.border}33`,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.06em',
      display: 'inline-block',
    }}>
      {cfg.label}
    </span>
  );
}
