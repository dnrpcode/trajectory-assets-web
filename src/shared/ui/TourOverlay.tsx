import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTour } from './TourContext';
import { TOUR_STEPS, TourPlacement } from '@/shared/constants/tourSteps';

const TOOLTIP_W = 300;
const PADDING = 12;
const GAP = 16;

interface Rect { top: number; left: number; width: number; height: number }

function getTooltipPos(rect: Rect, placement: TourPlacement, tooltipH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  switch (placement) {
    case 'right': return {
      left: clamp(rect.left + rect.width + GAP, 0, vw - TOOLTIP_W - 8),
      top: clamp(rect.top + rect.height / 2 - tooltipH / 2, 8, vh - tooltipH - 8),
    };
    case 'left': return {
      left: clamp(rect.left - GAP - TOOLTIP_W, 8, vw - TOOLTIP_W - 8),
      top: clamp(rect.top + rect.height / 2 - tooltipH / 2, 8, vh - tooltipH - 8),
    };
    case 'bottom': return {
      top: clamp(rect.top + rect.height + GAP, 8, vh - tooltipH - 8),
      left: clamp(rect.left + rect.width / 2 - TOOLTIP_W / 2, 8, vw - TOOLTIP_W - 8),
    };
    case 'top': return {
      top: clamp(rect.top - GAP - tooltipH, 8, vh - tooltipH - 8),
      left: clamp(rect.left + rect.width / 2 - TOOLTIP_W / 2, 8, vw - TOOLTIP_W - 8),
    };
    default:
      return { top: window.innerHeight / 2 - tooltipH / 2, left: window.innerWidth / 2 - TOOLTIP_W / 2 };
  }
}

export function TourOverlay() {
  const { isActive, step, currentStep, totalSteps, next, prev, skip } = useTour();
  const { t } = useTranslation();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(180);

  const findTarget = useCallback(() => {
    if (!step?.target) { setTargetRect(null); return; }
    let attempts = 0;
    const poll = () => {
      const el = document.querySelector(step.target!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          const r = el.getBoundingClientRect();
          setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 250);
      } else if (attempts < 12) {
        attempts++;
        setTimeout(poll, 100);
      }
    };
    setTimeout(poll, 350);
  }, [step]);

  useEffect(() => {
    if (!isActive) { setTargetRect(null); return; }
    findTarget();
  }, [isActive, findTarget]);

  useEffect(() => {
    if (tooltipRef.current) setTooltipH(tooltipRef.current.offsetHeight);
  });

  useEffect(() => {
    const onResize = () => findTarget();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [findTarget]);

  if (!isActive || !step) return null;

  const isCenter = !step.target || !targetRect;
  const placement = step.placement ?? 'center';

  const hl: Rect = targetRect
    ? { top: targetRect.top - PADDING, left: targetRect.left - PADDING, width: targetRect.width + PADDING * 2, height: targetRect.height + PADDING * 2 }
    : { top: 0, left: 0, width: 0, height: 0 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipPos = isCenter
    ? { top: vh / 2 - tooltipH / 2, left: vw / 2 - TOOLTIP_W / 2 }
    : getTooltipPos(hl, placement, tooltipH);

  const stepNum = currentStep + 1;
  const isFirst = currentStep === 0;
  const isFinish = step.id === 'finish';

  return (
    <>
      {!isCenter && targetRect && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: vh - hl.top, background: 'rgba(0,0,0,0.68)', zIndex: 9000, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', top: hl.top + hl.height, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.68)', zIndex: 9000, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', top: hl.top, left: 0, width: hl.left, height: hl.height, background: 'rgba(0,0,0,0.68)', zIndex: 9000, pointerEvents: 'none' }} />
          <div style={{ position: 'fixed', top: hl.top, left: hl.left + hl.width, right: 0, height: hl.height, background: 'rgba(0,0,0,0.68)', zIndex: 9000, pointerEvents: 'none' }} />
          <div style={{
            position: 'fixed', top: hl.top, left: hl.left, width: hl.width, height: hl.height,
            border: '2px solid var(--blue-400)', borderRadius: 10,
            boxShadow: '0 0 0 3px rgba(77,124,255,0.18), 0 0 24px rgba(77,124,255,0.35)',
            zIndex: 9001, pointerEvents: 'none', transition: 'all 0.25s ease',
          }} />
        </>
      )}

      {isCenter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9000 }} onClick={skip} />
      )}

      <div
        ref={tooltipRef}
        style={{
          position: 'fixed', top: tooltipPos.top, left: tooltipPos.left,
          width: TOOLTIP_W, zIndex: 9002,
          background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
          borderRadius: 14, padding: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          transition: isCenter ? 'none' : 'top 0.25s ease, left 0.25s ease',
        }}
      >
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 3, background: 'var(--border-dim)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(stepNum / totalSteps) * 100}%`, background: 'var(--blue-400)', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{stepNum}/{totalSteps}</span>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
          {t(step.titleKey)}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
          {t(step.descKey)}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === currentStep ? 16 : 6, height: 6, borderRadius: 99,
              background: i === currentStep ? 'var(--blue-400)' : i < currentStep ? 'var(--border-strong)' : 'var(--border-dim)',
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          {!isFirst ? (
            <button onClick={prev} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
              {t('tour.prev')}
            </button>
          ) : (
            <button onClick={skip} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
              {t('tour.skip')}
            </button>
          )}
          <button onClick={next} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: isFinish ? 'var(--gain-500)' : 'var(--blue-400)', border: 'none', color: '#fff' }}>
            {isFinish ? t('tour.finish') : t('tour.next')}
          </button>
        </div>
      </div>
    </>
  );
}
