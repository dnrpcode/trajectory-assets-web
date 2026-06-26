import { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style, className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-raised)',
        backgroundImage: 'linear-gradient(90deg, var(--bg-raised) 0%, var(--bg-hover) 50%, var(--bg-raised) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-sweep 1.6s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ── Page-level skeleton layouts ───────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width={160} height={28} borderRadius={8} />
          <Skeleton width={110} height={14} />
        </div>
        <Skeleton width={120} height={38} borderRadius={10} />
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
        <Skeleton height={90} borderRadius={12} style={{ gridColumn: 'span 2' }} />
        <Skeleton height={80} borderRadius={12} />
        <Skeleton height={80} borderRadius={12} />
        <Skeleton height={80} borderRadius={12} />
        <Skeleton height={80} borderRadius={12} />
      </div>

      {/* Chart */}
      <Skeleton height={220} borderRadius={14} style={{ marginBottom: 20 }} />

      {/* Bottom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Skeleton height={200} borderRadius={14} />
        <Skeleton height={200} borderRadius={14} />
      </div>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            borderRadius: 14,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton width={120} height={14} />
                <Skeleton width={80} height={11} />
              </div>
            </div>
            <Skeleton width={70} height={14} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Skeleton height={36} borderRadius={8} />
            <Skeleton height={36} borderRadius={8} />
            <Skeleton height={36} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssetDetailSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px 16px 80px' }}>
      {/* Back button + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Skeleton width={32} height={32} borderRadius={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={90} height={12} />
        </div>
        <Skeleton width={32} height={32} borderRadius={8} />
      </div>

      {/* Hero value card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-dim)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <Skeleton width={90} height={11} />
        <Skeleton width={180} height={32} borderRadius={8} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={80} height={22} borderRadius={6} />
          <Skeleton width={70} height={22} borderRadius={6} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Skeleton width="60%" height={10} />
              <Skeleton width="80%" height={14} />
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[80, 70, 65, 75].map((w, i) => (
          <Skeleton key={i} width={w} height={32} borderRadius={20} />
        ))}
      </div>

      {/* Content blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={120} borderRadius={14} />
        <Skeleton height={90} borderRadius={14} />
        <Skeleton height={160} borderRadius={14} />
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Skeleton width={34} height={34} borderRadius={8} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton width={130} height={13} />
              <Skeleton width={80} height={10} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <Skeleton width={75} height={13} />
            <Skeleton width={50} height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoinListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Skeleton width={36} height={36} borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton width={100} height={13} />
              <Skeleton width={50} height={10} />
            </div>
          </div>
          <Skeleton width={80} height={13} />
        </div>
      ))}
    </div>
  );
}
