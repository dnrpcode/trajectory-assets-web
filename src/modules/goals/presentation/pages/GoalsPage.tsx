import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Info } from 'lucide-react';
import { Layout } from '@/shared/ui/Layout';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Spinner } from '@/shared/ui/Spinner';
import { useToast } from '@/shared/ui/Toast';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { usePortfolioSummary, usePortfolioHistory } from '@/modules/dashboard';
import { computeSmartCAGR } from '@/shared/utils/portfolioProjections';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { computeGoalProgress } from '@/infrastructure/di/container';
import type { RiskProfile } from '@/shared/types';
import type { Goal } from '../../domain/entities/Goal';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, type GoalFormInput } from '../hooks/useGoals';
import { GoalCard } from '../components/GoalCard';
import { GoalFormModal } from '../components/GoalFormModal';

export function GoalsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const { data: goals = [], isLoading } = useGoals();
  const { data: summary } = usePortfolioSummary();
  const { data: history = [] } = usePortfolioHistory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const currentValue = summary?.totalValueIDR ?? 0;
  const riskProfile: RiskProfile = user?.riskProfile ?? 'moderate';
  const { rate: cagrRate } = computeSmartCAGR(history, summary?.allocationActual, riskProfile);

  const progresses = useMemo(
    () => goals.map((g) => computeGoalProgress.execute(g, currentValue, cagrRate)),
    [goals, currentValue, cagrRate],
  );

  const openCreate = () => { setEditingGoal(null); setFormOpen(true); };
  const openEdit = (goal: Goal) => { setEditingGoal(goal); setFormOpen(true); };

  const handleSubmit = async (values: GoalFormInput) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({ goalId: editingGoal.id, input: values });
        toast(t('goals.toast.updated'), 'success');
      } else {
        await createGoal.mutateAsync(values);
        toast(t('goals.toast.created'), 'success');
      }
      setFormOpen(false);
    } catch {
      toast(t('common.error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoal.mutateAsync(deletingGoal.id);
      toast(t('goals.toast.deleted'), 'success');
      setDeletingGoal(null);
    } catch {
      toast(t('common.error'), 'error');
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>
            {t('goals.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            {t('goals.subtitle')}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          {t('goals.addGoal')}
        </Button>
      </div>

      {/* Basis perhitungan */}
      {goals.length > 0 && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6"
          style={{ background: 'var(--blue-tint)', border: '1px solid var(--border-subtle)' }}
        >
          <Info size={14} style={{ color: 'var(--blue-400)', flexShrink: 0 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
            {t('goals.basis', { value: formatCurrency(currentValue), rate: cagrRate })}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : goals.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center text-center py-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--blue-tint)', color: 'var(--blue-400)' }}
            >
              <Target size={22} />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: 700 }}>
              {t('goals.emptyTitle')}
            </h2>
            <p className="mt-2 max-w-sm" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {t('goals.emptyDesc')}
            </p>
            <Button className="mt-6" variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
              {t('goals.emptyCta')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progresses.map((p) => (
            <GoalCard
              key={p.goal.id}
              progress={p}
              onEdit={() => openEdit(p.goal)}
              onDelete={() => setDeletingGoal(p.goal)}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        goal={editingGoal}
        onSubmit={handleSubmit}
        submitting={createGoal.isPending || updateGoal.isPending}
      />

      {/* Konfirmasi hapus */}
      <Modal open={!!deletingGoal} onClose={() => setDeletingGoal(null)} title={t('goals.deleteTitle')} size="sm">
        <div className="px-6 py-5">
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {t('goals.deleteDesc', { name: deletingGoal?.name || t('goals.defaultName') })}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeletingGoal(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={deleteGoal.isPending} onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
