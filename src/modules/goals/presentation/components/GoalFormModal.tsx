import React, { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { NumericInput } from '@/shared/ui/NumericInput';
import { useThemeContext } from '@/shared/ui/ThemeContext';
import type { Goal } from '../../domain/entities/Goal';
import type { GoalFormInput } from '../hooks/useGoals';

interface GoalFormValues {
  name: string;
  targetAmountIDR: number;
  targetDate?: string;
  monthlyContributionIDR?: number;
  description?: string;
}

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Kalau diisi = mode edit */
  goal?: Goal | null;
  onSubmit: (values: GoalFormInput) => Promise<void>;
  submitting: boolean;
}

function toDateInputValue(d?: Date): string {
  if (!d) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

export function GoalFormModal({ open, onClose, goal, onSubmit, submitting }: GoalFormModalProps) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();

  const schema = z.object({
    name: z.string().min(1, t('goals.form.nameRequired')),
    targetAmountIDR: z.number({ error: t('goals.form.targetRequired') }).min(1, t('goals.form.targetRequired')),
    targetDate: z.string().optional(),
    monthlyContributionIDR: z.number().optional(),
    description: z.string().optional(),
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<GoalFormValues>,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: goal?.name ?? '',
      targetAmountIDR: goal?.targetAmountIDR,
      targetDate: toDateInputValue(goal?.targetDate),
      monthlyContributionIDR: goal?.monthlyContributionIDR,
      description: goal?.description ?? '',
    });
  }, [open, goal, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      targetAmountIDR: values.targetAmountIDR,
      targetDate: values.targetDate || undefined,
      monthlyContributionIDR: values.monthlyContributionIDR || undefined,
      description: values.description?.trim() || undefined,
    });
  });

  return (
    <Modal open={open} onClose={onClose} title={goal ? t('goals.form.editTitle') : t('goals.form.addTitle')} size="md">
      <form onSubmit={submit} className="px-6 py-5 space-y-4">
        <Input
          label={t('goals.form.name')}
          placeholder={t('goals.form.namePlaceholder')}
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          name="targetAmountIDR"
          control={control}
          render={({ field }) => (
            <NumericInput
              label={t('goals.form.targetAmount')}
              placeholder={t('goals.form.targetAmountPlaceholder')}
              prefix="Rp"
              error={errors.targetAmountIDR?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div>
          <label style={labelStyle}>{t('goals.form.targetDate')}</label>
          <input
            type="date"
            {...register('targetDate')}
            style={{
              width: '100%',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '0 14px',
              height: '40px',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              cursor: 'pointer',
              colorScheme: theme,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('goals.form.targetDateHint')}</p>
        </div>

        <Controller
          name="monthlyContributionIDR"
          control={control}
          render={({ field }) => (
            <NumericInput
              label={t('goals.form.monthlyContribution')}
              placeholder={t('goals.form.monthlyContributionPlaceholder')}
              prefix="Rp"
              hint={t('goals.form.monthlyContributionHint')}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Input
          label={t('goals.form.description')}
          placeholder={t('goals.form.descriptionPlaceholder')}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {goal ? t('goals.form.saveChanges') : t('goals.form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
