import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import type { Asset } from '@/shared/types/asset';
import type { AssetEntry } from '@/shared/types/assetEntry';
import { useAssetInsight, useRefreshAssetInsight } from '../hooks/useAssetInsight';

interface Props {
  asset: Asset;
  entries: AssetEntry[];
}

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 8);
    return () => clearInterval(id);
  }, [text]);

  return <>{displayed}</>;
}

function InsightBullets({ text }: { text: string }) {
  // Split on bullet points — model outputs "• ..." lines
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.startsWith('•') || l.startsWith('-'));
  const rest    = lines.filter((l) => !l.startsWith('•') && !l.startsWith('-'));

  if (bullets.length === 0) {
    // Fallback: render as plain paragraph
    return (
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        <TypingText text={text} />
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rest.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{rest.join(' ')}</p>
      )}
      {bullets.map((line, i) => {
        const content = line.replace(/^[•\-]\s*/, '');
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 9,
              background: 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.14)',
              borderRadius: 9,
              padding: '9px 12px',
            }}
          >
            <span style={{ color: 'var(--ai-accent)', fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>•</span>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {i === bullets.length - 1 ? <TypingText text={content} /> : content}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonPulse() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[80, 95, 70].map((w, i) => (
        <div
          key={i}
          style={{
            height: 54,
            borderRadius: 9,
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.12)',
            animation: 'pulse 1.6s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
            width: `${w}%`,
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
    </div>
  );
}

export function AssetInsightCard({ asset, entries }: Props) {
  const { data: insight, isLoading, isError, isFetching } = useAssetInsight(asset, entries);
  const refresh = useRefreshAssetInsight(asset);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(77,124,255,0.04) 100%)',
        border: '1px solid rgba(167,139,250,0.22)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 16px',
          borderBottom: '1px solid rgba(167,139,250,0.14)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={14} strokeWidth={2} color="var(--ai-accent)" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            AI Insight
          </h2>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
            {isLoading || isFetching
              ? 'Menganalisis posisi...'
              : insight
              ? 'Diperbarui · cache 15 menit'
              : 'Analisis berbasis data posisi kamu'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant="ai">Beta</Badge>
          {!isLoading && (
            <button
              onClick={refresh}
              disabled={isFetching}
              title="Perbarui insight"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: isFetching ? 'not-allowed' : 'pointer',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                opacity: isFetching ? 0.4 : 1,
                transition: 'color 0.15s',
              }}
            >
              <RefreshCw
                size={13}
                strokeWidth={2.2}
                style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {(isLoading && !insight) && <SkeletonPulse />}

        {isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: 'var(--loss-tint)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 9,
            }}
          >
            <AlertTriangle size={14} color="var(--loss-400)" strokeWidth={2} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Gagal mengambil insight. Periksa koneksi atau coba lagi.
            </p>
          </div>
        )}

        {insight && <InsightBullets text={insight} />}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
