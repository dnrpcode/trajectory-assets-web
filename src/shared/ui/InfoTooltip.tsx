import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  size?: number;
}

interface TooltipCoords {
  top?: number;
  bottom?: number;
  left: number;
  arrowPos: 'top' | 'bottom';
}

export function InfoTooltip({ content, size = 13 }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords>({ left: 0, arrowPos: 'top' });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const TOOLTIP_WIDTH = 230;
      const MARGIN = 8;

      // Horizontal: center on trigger, clamp to viewport
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - MARGIN));

      // Vertical: prefer above, flip below if too close to top
      const showAbove = rect.top > 160;
      setCoords({
        left,
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
        arrowPos: showAbove ? 'bottom' : 'top',
      });
    }
  }, [visible]);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ cursor: 'help', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <HelpCircle
        size={size}
        strokeWidth={1.75}
        style={{ color: 'var(--text-muted)', display: 'block' }}
      />
      {visible && createPortal(
        <span
          style={{
            position: 'fixed',
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left,
            width: 230,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        >
          {content}
          <span
            style={{
              position: 'absolute',
              [coords.arrowPos === 'bottom' ? 'bottom' : 'top']: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderTop: coords.arrowPos === 'bottom' ? 'none' : undefined,
              borderLeft: coords.arrowPos === 'bottom' ? 'none' : undefined,
              borderBottom: coords.arrowPos === 'top' ? 'none' : undefined,
              borderRight: coords.arrowPos === 'top' ? 'none' : undefined,
            }}
          />
        </span>,
        document.body
      )}
    </span>
  );
}
