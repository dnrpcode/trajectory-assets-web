import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Check, X, Wallet } from 'lucide-react';
import { NumericInput } from '@/shared/ui/NumericInput';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { updateUserProfile } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';

/**
 * Satu input setoran bulanan global (bukan per-target) — disimpan di
 * user.monthlyInvestmentIDR, dipakai bersama oleh semua target finansial
 * dalam model waterfall (lihat BuildGoalRoadmap).
 */
export function MonthlyContributionInput() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | undefined>(user?.monthlyInvestmentIDR);
  const [saving, setSaving] = useState(false);

  const current = user?.monthlyInvestmentIDR ?? 0;

  const startEdit = () => {
    setDraft(user?.monthlyInvestmentIDR);
    setEditing(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const value = draft ?? 0;
      await updateUserProfile.execute(user.id, { monthlyInvestmentIDR: value });
      setUser({ ...user, monthlyInvestmentIDR: value });
      setEditing(false);
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-end gap-2">
        <div style={{ flex: 1, maxWidth: 220 }}>
          <NumericInput
            label={t('goals.monthlyContribution.label')}
            prefix="Rp"
            value={draft}
            onChange={setDraft}
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'var(--gain-tint)', color: 'var(--gain-400)', border: '1px solid rgba(15,186,130,0.25)' }}
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="flex items-center gap-2.5 rounded-xl px-4 py-3 w-full text-left transition-colors"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--blue-tint)', color: 'var(--blue-400)' }}
      >
        <Wallet size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('goals.monthlyContribution.label')}
        </p>
        <p style={{ margin: '2px 0 0', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {current > 0 ? formatCurrency(current) : t('goals.monthlyContribution.notSet')}
        </p>
      </div>
      <Pencil size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
}
