import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth';

const GLITCH_CHARS = ['▓', '░', '▒', '█', '◆', '◇', '▪', '▫'];

function GlitchText({ text }: { text: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: `glitch-char ${0.8 + Math.random() * 2}s ${Math.random() * 1}s infinite`,
            color: i % 3 === 0 ? 'var(--blue-400)' : i % 3 === 1 ? 'var(--ai-accent)' : 'var(--text-primary)',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const randomGlitch = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes glitch-char {
          0%, 90%, 100% { transform: translateX(0) skewX(0); opacity: 1; }
          92% { transform: translateX(-2px) skewX(-5deg); opacity: 0.7; }
          94% { transform: translateX(2px) skewX(5deg); opacity: 0.9; }
          96% { transform: translateX(-1px); opacity: 0.5; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px var(--blue-glow), 0 0 40px var(--ai-glow); }
          50% { box-shadow: 0 0 40px var(--blue-glow), 0 0 80px var(--ai-glow); }
        }
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Scanline effect */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(transparent, rgba(77,124,255,0.15), transparent)',
        animation: 'scanline 4s linear infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(var(--blue-400) 1px, transparent 1px), linear-gradient(90deg, var(--blue-400) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Floating random chars in background */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${5 + i * 8}%`,
          top: `${10 + (i % 5) * 18}%`,
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--blue-400)',
          opacity: 0.08 + (i % 4) * 0.04,
          animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {['0x404', 'ERR', 'NULL', 'NaN', '?', '!', '∅', 'undefined', '{}', '[]', '404', randomGlitch][i]}
        </div>
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480 }}>

        {/* Big 404 */}
        <div style={{
          fontSize: 'clamp(80px, 18vw, 140px)',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          marginBottom: 8,
          background: 'linear-gradient(135deg, var(--blue-400), var(--ai-accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-4px',
          animation: 'float 3s ease-in-out infinite',
        }}>
          404
        </div>

        {/* Glitch subtitle */}
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: '0.05em',
        }}>
          <GlitchText text="PAGE_NOT_FOUND" />
        </div>

        {/* Terminal-style error box */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 28,
          textAlign: 'left',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}>
          <div style={{ color: 'var(--loss-400)', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>trajectory</span>
            <span style={{ color: 'var(--blue-400)' }}>@app</span>
            <span style={{ color: 'var(--text-muted)' }}> ~ % </span>
            <span style={{ color: 'var(--text-primary)' }}>cd {window.location.pathname}</span>
          </div>
          <div style={{ color: 'var(--loss-400)' }}>
            ✗ Error: No such route or directory
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            💡 Hint: halaman ini tidak exist di portofolio kamu
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, var(--blue-500), var(--ai-accent))',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              animation: 'pulse-glow 2s ease-in-out infinite',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {user ? '→ Kembali ke Dashboard' : '→ Login'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-raised)',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ← Halaman Sebelumnya
          </button>
        </div>

        {/* Ticker */}
        <div style={{
          marginTop: 40,
          overflow: 'hidden',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: 12,
          opacity: 0.35,
        }}>
          <div style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            animation: 'ticker 18s linear infinite',
          }}>
            {'ERR_404 • ROUTE_MISSING • HALAMAN_NGABUR • NULL_POINTER • STACK_OVERFLOW • BUY_THE_DIP • 404 NOT FOUND • ERR_404 • ROUTE_MISSING • HALAMAN_NGABUR •'}
          </div>
        </div>
      </div>
    </div>
  );
}
