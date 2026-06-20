import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Check, X, AlertTriangle, ShieldCheck, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { User } from '@/modules/user/domain/entities/User';
import { AllocationTarget, RiskProfile } from '@/shared/types';
import { useClaudeAdvisor, PendingAction } from '../hooks/useClaudeAdvisor';
import { CATEGORY_LABELS } from '@/shared/constants/categories';

interface Props {
  assets: Asset[];
  user: User;
  onUpdateRiskProfile?: (riskProfile: RiskProfile) => Promise<void>;
  onUpdateTargetAllocation?: (allocation: AllocationTarget) => Promise<void>;
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      result.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-bold mt-3 mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith('### ')) {
      result.push(
        <h4
          key={`h4-${i}`}
          className="text-xs font-semibold mt-2 mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {line.slice(4)}
        </h4>,
      );
    } else if (line.startsWith('- ')) {
      result.push(
        <div key={`li-${i}`} className="flex gap-2 ml-2 my-1">
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>•</span>
          <span style={{ color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</span>
        </div>,
      );
    } else if (line.trim()) {
      result.push(
        <p key={`p-${i}`} className="my-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {renderInline(line)}
        </p>,
      );
    }
  }

  return result;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function ActionCard({
  action,
  isApplying,
  onConfirm,
  onDismiss,
}: {
  action: PendingAction;
  isApplying: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  const RISK_LABEL: Record<RiskProfile, string> = {
    conservative: t('onboarding.conservative'),
    moderate: t('onboarding.moderate'),
    aggressive: t('onboarding.aggressive'),
  };

  return (
    <div
      className="mx-1 rounded-2xl p-4"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--ai-accent)', borderBottomLeftRadius: '4px' }}
    >
      <div className="flex items-center gap-2 mb-3">
        {action.type === 'updateRiskProfile' ? (
          <ShieldCheck size={15} style={{ color: 'var(--ai-accent)' }} strokeWidth={2} />
        ) : (
          <PieChart size={15} style={{ color: 'var(--ai-accent)' }} strokeWidth={2} />
        )}
        <span className="text-xs font-semibold" style={{ color: 'var(--ai-accent)' }}>
          {t('chat.proposedChange')}
        </span>
      </div>

      <p className="text-sm mb-3" style={{ color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)' }}>
        {action.summary}
      </p>

      {action.type === 'updateRiskProfile' && action.riskProfile && (
        <div
          className="rounded-lg px-3 py-2 mb-3 text-sm font-medium"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
        >
          {t('chat.newProfile')} <strong style={{ color: 'var(--text-primary)' }}>{RISK_LABEL[action.riskProfile]}</strong>
        </div>
      )}

      {action.type === 'updateTargetAllocation' && action.targetAllocation && (
        <div
          className="rounded-lg px-3 py-2 mb-3 space-y-1"
          style={{ background: 'var(--bg-overlay)' }}
        >
          {(Object.entries(action.targetAllocation) as [keyof AllocationTarget, number][])
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, pct]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_LABELS[cat]}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--ai-accent)', color: '#fff' }}
        >
          <Check size={12} strokeWidth={2.5} />
          {isApplying ? t('chat.applying') : t('chat.apply')}
        </button>
        <button
          onClick={onDismiss}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
        >
          <X size={12} strokeWidth={2.5} />
          {t('chat.dismiss')}
        </button>
      </div>
    </div>
  );
}

function NoApiKeyBanner() {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-start gap-3 mx-4 my-4 p-4 rounded-xl"
      style={{ background: 'var(--warn-tint)', border: '1px solid var(--warn-400)' }}
    >
      <AlertTriangle size={16} strokeWidth={2} style={{ color: 'var(--warn-400)', flexShrink: 0, marginTop: 1 }} />
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('chat.noApiKeyTitle')}</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          {t('chat.noApiKeyDesc')}
        </p>
      </div>
    </div>
  );
}

export function RoboAdvisorChat({ assets, user, onUpdateRiskProfile, onUpdateTargetAllocation }: Props) {
  const { t } = useTranslation();
  const { messages, isLoading, isTyping, pendingAction, hasApiKey, sendMessage, dismissAction } = useClaudeAdvisor(assets, user);
  const [input, setInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const RISK_LABEL: Record<RiskProfile, string> = {
    conservative: t('onboarding.conservative'),
    moderate: t('onboarding.moderate'),
    aggressive: t('onboarding.aggressive'),
  };

  const QUICK_PROMPTS = [
    t('chat.quickPrompt1'),
    t('chat.quickPrompt2'),
    t('chat.quickPrompt3'),
    t('chat.quickPrompt4'),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isTyping, pendingAction]);

  const send = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || isApplying) return;
    setIsApplying(true);
    try {
      if (pendingAction.type === 'updateRiskProfile' && pendingAction.riskProfile && onUpdateRiskProfile) {
        await onUpdateRiskProfile(pendingAction.riskProfile);
        setSuccessMsg(t('chat.riskUpdated', { profile: RISK_LABEL[pendingAction.riskProfile] }));
      } else if (pendingAction.type === 'updateTargetAllocation' && pendingAction.targetAllocation && onUpdateTargetAllocation) {
        await onUpdateTargetAllocation(pendingAction.targetAllocation);
        setSuccessMsg(t('chat.allocationUpdated'));
      }
      dismissAction();
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', height: '560px' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--blue-tint-2)', border: '1px solid rgba(77,124,255,0.3)' }}
        >
          <Bot size={20} strokeWidth={2} style={{ color: 'var(--ai-accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('chat.title')}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('chat.subtitle', { model: import.meta.env.VITE_AI_MODEL?.split('/')[1] || 'model' })}
          </p>
        </div>
        <div
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={
            hasApiKey
              ? { background: 'var(--gain-tint)', color: 'var(--gain-400)', border: '1px solid rgba(15,186,130,0.22)' }
              : { background: 'var(--warn-tint)', color: 'var(--warn-400)', border: '1px solid rgba(245,158,11,0.22)' }
          }
        >
          {hasApiKey ? t('chat.online') : t('chat.setupRequired')}
        </div>
      </div>

      {!hasApiKey && <NoApiKeyBanner />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && hasApiKey && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
              >
                <Bot size={22} strokeWidth={1.75} style={{ color: 'var(--ai-accent)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {t('chat.greeting', { name: user.displayName?.split(' ')[0] })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('chat.greetingDesc')}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
              style={
                msg.role === 'user'
                  ? { background: 'var(--blue-500)', color: 'var(--text-on-accent)', borderBottomRightRadius: '4px', lineHeight: 'var(--leading-relaxed)' }
                  : { background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderBottomLeftRadius: '4px', lineHeight: 'var(--leading-relaxed)' }
              }
            >
              {renderMarkdown(msg.content)}
            </div>
          </div>
        ))}

        {/* Pending action card */}
        {pendingAction && (
          <ActionCard
            action={pendingAction}
            isApplying={isApplying}
            onConfirm={handleConfirmAction}
            onDismiss={dismissAction}
          />
        )}

        {/* Success toast */}
        {successMsg && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'var(--gain-tint)', color: 'var(--gain-400)', border: '1px solid rgba(15,186,130,0.22)' }}
          >
            <Check size={13} strokeWidth={2.5} />
            {successMsg}
          </div>
        )}

        {/* Typing indicator */}
        {(isLoading || isTyping) && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderBottomLeftRadius: '4px' }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex gap-2 mb-3 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={isLoading || !hasApiKey}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--blue-tint)', color: 'var(--blue-300)', border: '1px solid rgba(77,124,255,0.22)' }}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl text-sm px-4 py-2.5 outline-none"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            placeholder={hasApiKey ? t('chat.placeholder') : t('chat.placeholderDisabled')}
            value={input}
            disabled={!hasApiKey}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading || !hasApiKey}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: 'var(--blue-500)', color: '#fff' }}
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
