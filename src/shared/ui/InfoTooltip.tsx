import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  size?: number;
}

export function InfoTooltip({ content, size = 13 }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<'top' | 'bottom'>('top');
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 80 ? 'bottom' : 'top');
    }
  }, [visible]);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ cursor: 'help', verticalAlign: 'middle' }}
    >
      <HelpCircle
        size={size}
        strokeWidth={1.75}
        style={{ color: 'var(--text-muted)', display: 'block' }}
      />
      {visible && (
        <span
          style={{
            position: 'absolute',
            [pos === 'top' ? 'bottom' : 'top']: `calc(100% + 6px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            width: 220,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        >
          {content}
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              [pos === 'top' ? 'bottom' : 'top']: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderTop: pos === 'top' ? 'none' : undefined,
              borderLeft: pos === 'top' ? 'none' : undefined,
              borderBottom: pos === 'bottom' ? 'none' : undefined,
              borderRight: pos === 'bottom' ? 'none' : undefined,
            }}
          />
        </span>
      )}
    </span>
  );
}
