import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastType, { border: string; icon: typeof Info }> = {
  success: { border: 'var(--gain-500)', icon: CheckCircle },
  error:   { border: 'var(--loss-500)', icon: XCircle },
  info:    { border: 'var(--blue-400)', icon: Info },
};

const TEXT_COLOR: Record<ToastType, string> = {
  success: 'var(--gain-400)',
  error:   'var(--loss-400)',
  info:    'var(--blue-400)',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { border, icon: Icon } = CONFIG[item.type];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 4500);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'var(--bg-surface)',
        border: `1px solid var(--border-default)`,
        borderLeft: `3px solid ${border}`,
        borderRadius: 10,
        padding: '12px 14px',
        minWidth: 280, maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        animation: 'toastIn 0.18s ease',
      }}
    >
      <Icon size={15} style={{ color: TEXT_COLOR[item.type], flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>
        {item.message}
      </span>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Tutup notifikasi"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9998, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}
          aria-live="polite"
          aria-atomic="false"
        >
          <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: 'auto' }}>
              <ToastCard item={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
