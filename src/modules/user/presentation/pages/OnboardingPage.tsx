import { useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { getAllocationTarget } from '@/shared/constants/allocationTargets';
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '@/shared/constants/categories';
import { EntryForm } from '@/modules/portfolio/presentation/components/EntryForm';
import { completeOnboarding } from '@/infrastructure/di/container';
import { useAuthStore } from '@/modules/auth';
import { RiskProfile, InvestmentHorizon, AssetCategory } from '@/shared/types';

const goalSchema = z.object({
  targetAmountIDR: z.coerce.number().min(1, 'Masukkan target'),
  targetDate: z.string().optional(),
  monthlyContributionIDR: z.coerce.number().optional(),
});

type GoalValues = z.infer<typeof goalSchema>;

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0c1422"/>
      <line x1="4" y1="28" x2="28" y2="28" stroke="#1a2a40" strokeWidth="1"/>
      <line x1="4" y1="20" x2="28" y2="20" stroke="#1a2a40" strokeWidth="1"/>
      <line x1="4" y1="12" x2="28" y2="12" stroke="#1a2a40" strokeWidth="1"/>
      <circle cx="26" cy="7" r="5" fill="rgba(77,124,255,0.15)"/>
      <polyline points="5,26 10,20 16,14 22,10 26,7" stroke="#4d7cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26" cy="7" r="2.5" fill="#4d7cff"/>
    </svg>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { authUser, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');
  const [horizon, setHorizon] = useState<InvestmentHorizon>('medium');
  const [hasPortfolio, setHasPortfolio] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<GoalValues>({
    resolver: zodResolver(goalSchema) as unknown as Resolver<GoalValues>,
  });

  const allocation = getAllocationTarget(riskProfile, horizon);
  const allocationData = ALL_CATEGORIES
    .filter((cat) => allocation[cat as AssetCategory] > 0)
    .map((cat) => ({
      name: CATEGORY_LABELS[cat as AssetCategory],
      value: allocation[cat as AssetCategory],
      color: CATEGORY_COLORS[cat as AssetCategory],
    }));

  const saveUserAndProceed = async (goalData?: GoalValues): Promise<void> => {
    if (!authUser) return;
    setSaving(true);
    try {
      const now = new Date();
      await completeOnboarding.execute({
        userId: authUser.uid,
        email: authUser.email ?? '',
        displayName: authUser.displayName ?? authUser.email ?? '',
        riskProfile,
        investmentHorizon: horizon,
        goal: goalData?.targetAmountIDR ? {
          targetAmountIDR: goalData.targetAmountIDR,
          targetDate: goalData.targetDate,
          monthlyContributionIDR: goalData.monthlyContributionIDR,
        } : undefined,
      });

      setUser({
        id: authUser.uid,
        email: authUser.email ?? '',
        displayName: authUser.displayName ?? authUser.email ?? '',
        riskProfile,
        investmentHorizon: horizon,
        baseCurrency: 'IDR',
        targetAllocation: getAllocationTarget(riskProfile, horizon),
        aiHistoryEnabled: false,
        onboardingComplete: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      console.error('Onboarding save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const RISK_OPTIONS: { value: RiskProfile; label: string; desc: string; icon: string }[] = [
    { value: 'conservative', label: t('onboarding.conservative'), desc: t('onboarding.conservativeDesc'), icon: '🛡' },
    { value: 'moderate',     label: t('onboarding.moderate'),     desc: t('onboarding.moderateDesc'),     icon: '⚖' },
    { value: 'aggressive',   label: t('onboarding.aggressive'),   desc: t('onboarding.aggressiveDesc'),   icon: '🚀' },
  ];

  const HORIZON_OPTIONS: { value: InvestmentHorizon; label: string; range: string; desc: string }[] = [
    { value: 'short',  label: t('onboarding.short'),  range: t('onboarding.shortRange'),  desc: t('onboarding.shortDesc') },
    { value: 'medium', label: t('onboarding.medium'), range: t('onboarding.mediumRange'), desc: t('onboarding.mediumDesc') },
    { value: 'long',   label: t('onboarding.long'),   range: t('onboarding.longRange'),   desc: t('onboarding.longDesc') },
  ];

  const stepLabels = [
    t('onboarding.stepRiskProfile'),
    t('onboarding.stepHorizon'),
    t('onboarding.stepTarget'),
    t('onboarding.stepPortfolio'),
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <LogoMark />
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
            Trajectory
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200"
                    style={{
                      background: isDone ? 'var(--blue-400)' : isActive ? 'var(--blue-tint-2)' : 'var(--bg-raised)',
                      color: isDone ? '#fff' : isActive ? 'var(--blue-300)' : 'var(--text-muted)',
                      border: isActive ? '1.5px solid var(--blue-400)' : isDone ? 'none' : '1px solid var(--border-default)',
                      boxShadow: isActive ? 'var(--glow-brand-xs)' : 'none',
                    }}
                  >
                    {isDone ? (
                      <Check size={12} strokeWidth={3} />
                    ) : s}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {label}
                  </span>
                </div>
                {s < 4 && (
                  <div
                    className="flex-1 h-px mx-1"
                    style={{ background: isDone ? 'var(--blue-400)' : 'var(--border-subtle)' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div
          className="rounded-[var(--radius-xl)] p-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}
        >
          {/* Step 1: Risk Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                {t('onboarding.riskProfileTitle')}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('onboarding.riskProfileSubtitle')}
              </p>

              <div className="space-y-3 mb-6">
                {RISK_OPTIONS.map((opt) => {
                  const selected = riskProfile === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRiskProfile(opt.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] text-left transition-all duration-150"
                      style={{
                        background: selected ? 'var(--blue-tint)' : 'var(--bg-raised)',
                        border: selected ? '1.5px solid var(--blue-400)' : '1px solid var(--border-default)',
                        boxShadow: selected ? 'var(--glow-brand-xs)' : 'none',
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: selected ? 'var(--blue-200)' : 'var(--text-primary)' }}>
                          {opt.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
                      </div>
                      {selected && (
                        <span className="ml-auto flex-shrink-0" style={{ color: 'var(--blue-400)' }}>
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Allocation preview */}
              <div
                className="rounded-[var(--radius-lg)] p-4 mb-6"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
              >
                <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}>
                  {t('onboarding.recommendedAllocation')}
                </p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" outerRadius={54} innerRadius={28} dataKey="value" strokeWidth={0}>
                        {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {allocationData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        <span className="ml-auto font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep(2)} fullWidth size="lg">
                {t('onboarding.next')}
              </Button>
            </div>
          )}

          {/* Step 2: Investment Horizon */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                {t('onboarding.horizonTitle')}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('onboarding.horizonSubtitle')}
              </p>

              <div className="space-y-3 mb-8">
                {HORIZON_OPTIONS.map((opt) => {
                  const selected = horizon === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHorizon(opt.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] text-left transition-all duration-150"
                      style={{
                        background: selected ? 'var(--blue-tint)' : 'var(--bg-raised)',
                        border: selected ? '1.5px solid var(--blue-400)' : '1px solid var(--border-default)',
                        boxShadow: selected ? 'var(--glow-brand-xs)' : 'none',
                      }}
                    >
                      <div
                        className="w-12 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-center leading-tight"
                        style={{
                          background: selected ? 'rgba(77,124,255,0.2)' : 'var(--bg-overlay)',
                          color: selected ? 'var(--blue-300)' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.range}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: selected ? 'var(--blue-200)' : 'var(--text-primary)' }}>
                          {opt.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
                      </div>
                      {selected && (
                        <span className="ml-auto flex-shrink-0" style={{ color: 'var(--blue-400)' }}>
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} size="lg" style={{ flex: 1 }}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(3)} size="lg" style={{ flex: 1 }}>
                  {t('onboarding.next')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Financial Goal */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                {t('onboarding.goalTitle')}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('onboarding.goalSubtitle')}
              </p>

              <form
                onSubmit={handleSubmit(async (data: GoalValues) => {
                  await saveUserAndProceed(data);
                  setStep(4);
                })}
                className="space-y-4"
              >
                <Input
                  label={t('onboarding.goalTargetLabel')}
                  type="number"
                  prefix="Rp"
                  placeholder={t('onboarding.goalTargetPlaceholder')}
                  error={errors.targetAmountIDR?.message}
                  {...register('targetAmountIDR')}
                />
                <Input
                  label={t('onboarding.goalDateLabel')}
                  type="date"
                  {...register('targetDate')}
                />
                <Input
                  label={t('onboarding.goalMonthly')}
                  type="number"
                  prefix="Rp"
                  placeholder={t('onboarding.goalMonthlyPlaceholder')}
                  {...register('monthlyContributionIDR')}
                />

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} size="lg" style={{ flex: 1 }}>
                    {t('common.back')}
                  </Button>
                  <Button type="submit" loading={saving} size="lg" style={{ flex: 1 }}>
                    {t('onboarding.next')}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    await saveUserAndProceed();
                    setStep(4);
                  }}
                  size="sm"
                  fullWidth
                >
                  {t('onboarding.skipStep')}
                </Button>
              </form>
            </div>
          )}

          {/* Step 4: Existing portfolio */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                {t('onboarding.portfolioTitle')}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('onboarding.portfolioSubtitle')}
              </p>

              {hasPortfolio === null && (
                <div className="space-y-3">
                  {[
                    {
                      icon: '💼',
                      title: t('onboarding.hasPortfolioTitle'),
                      desc: t('onboarding.hasPortfolioDesc'),
                      onClick: () => setHasPortfolio(true),
                    },
                    {
                      icon: '🌱',
                      title: t('onboarding.noPortfolioTitle'),
                      desc: t('onboarding.noPortfolioDesc'),
                      onClick: () => navigate('/dashboard'),
                    },
                  ].map((opt) => (
                    <button
                      key={opt.title}
                      type="button"
                      onClick={opt.onClick}
                      className="w-full flex items-center gap-4 p-5 rounded-[var(--radius-lg)] text-left transition-all duration-150"
                      style={{
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-default)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--blue-400)';
                        e.currentTarget.style.background = 'var(--blue-tint)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.background = 'var(--bg-raised)';
                      }}
                    >
                      <span className="text-3xl">{opt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {hasPortfolio === true && (
                <div>
                  <div
                    className="rounded-md px-4 py-3 text-sm mb-5"
                    style={{ background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.22)', color: 'var(--blue-300)' }}
                  >
                    {t('onboarding.addFirstAsset')}
                  </div>
                  <EntryForm
                    onSuccess={() => navigate('/dashboard')}
                    defaultEntryType="new_position"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
