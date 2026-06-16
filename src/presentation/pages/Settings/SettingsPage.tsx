import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Shield, Clock, Bot, Moon, Sun, Globe, LogOut, Check, Save, TrendingUp,
} from 'lucide-react';
import { Layout } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../hooks/useAuth';
import { useThemeContext } from '../../contexts/ThemeContext';
import { updateUserProfile, logout } from '../../../infrastructure/di/container';
import { getAllocationTarget } from '../../../shared/constants/allocationTargets';
import { RiskProfile, InvestmentHorizon, AllocationTarget, AssetCategory } from '../../../shared/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../../shared/constants/categories';

const schema = z.object({
  displayName: z.string().min(2, 'Minimal 2 karakter'),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  aiHistoryEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function SectionCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-400)' }}>
          {icon}
        </div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function OptionCard({
  selected, onClick, label, description, badge,
}: { selected: boolean; onClick: () => void; label: string; description: string; badge?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: '10px',
        border: selected ? '1.5px solid var(--blue-400)' : '1.5px solid var(--border-default)',
        background: selected ? 'var(--blue-tint)' : 'var(--bg-raised)',
        cursor: 'pointer',
        transition: 'all 150ms',
        position: 'relative',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--blue-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={10} color="#fff" strokeWidth={3} />
        </div>
      )}
      <p style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'var(--blue-300)' : 'var(--text-primary)', margin: 0 }}>
        {label}
        {badge && (
          <span style={{ marginLeft: 6, fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'var(--gain-tint)', color: 'var(--gain-400)' }}>
            {badge}
          </span>
        )}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{description}</p>
    </button>
  );
}

const CATEGORIES: AssetCategory[] = ['saham', 'reksa_dana', 'obligasi_sbn', 'emas', 'kripto', 'cash', 'lainnya'];

function AllocationSimulation({
  current,
  preview,
  changed,
}: {
  current: AllocationTarget;
  preview: AllocationTarget;
  changed: boolean;
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: `1.5px solid ${changed ? 'var(--blue-400)' : 'var(--border-subtle)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 300ms' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-400)' }}>
            <TrendingUp size={14} strokeWidth={2} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>Simulasi Alokasi</h2>
        </div>
        {changed && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--blue-tint)', color: 'var(--blue-300)', border: '1px solid rgba(77,124,255,0.25)', letterSpacing: '0.04em' }}>
            BERUBAH
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div style={{ padding: '16px 18px 12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
          {changed ? 'Preview alokasi baru' : 'Alokasi saat ini'}
        </p>
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
          {CATEGORIES.filter((c) => preview[c] > 0).map((cat) => (
            <div
              key={cat}
              title={`${CATEGORY_LABELS[cat]}: ${preview[cat]}%`}
              style={{
                flex: preview[cat],
                background: CATEGORY_COLORS[cat],
                transition: 'flex 400ms cubic-bezier(0.4,0,0.2,1)',
                minWidth: preview[cat] > 0 ? 2 : 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Per-category rows */}
      <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CATEGORIES.map((cat) => {
          const cur = current[cat];
          const nxt = preview[cat];
          const diff = nxt - cur;
          if (cur === 0 && nxt === 0) return null;
          return (
            <div key={cat} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
              {/* Label + bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[cat], flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{CATEGORY_LABELS[cat]}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${nxt}%`,
                    background: CATEGORY_COLORS[cat],
                    transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
              {/* New pct */}
              <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', minWidth: 32, textAlign: 'right' }}>
                {nxt}%
              </span>
              {/* Diff badge */}
              <span style={{
                fontSize: '10px', fontWeight: 600, minWidth: 36, textAlign: 'right',
                color: diff > 0 ? 'var(--gain-400)' : diff < 0 ? 'var(--loss-400)' : 'var(--text-muted)',
                opacity: changed && diff !== 0 ? 1 : 0,
                transition: 'opacity 250ms',
              }}>
                {diff > 0 ? `+${diff}%` : `${diff}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: checked ? 'var(--blue-500)' : 'var(--bg-overlay)',
        border: checked ? '1.5px solid var(--blue-400)' : '1.5px solid var(--border-default)',
        position: 'relative', cursor: 'pointer', transition: 'all 200ms', padding: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: checked ? 22 : 3,
        transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeContext();
  const { user, setUser } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const { register, handleSubmit, setValue, control, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      displayName: user?.displayName ?? '',
      riskProfile: user?.riskProfile ?? 'moderate',
      investmentHorizon: user?.investmentHorizon ?? 'medium',
      aiHistoryEnabled: user?.aiHistoryEnabled ?? false,
    },
  });

  const riskProfile = useWatch({ control, name: 'riskProfile' });
  const investmentHorizon = useWatch({ control, name: 'investmentHorizon' });
  const aiHistoryEnabled = useWatch({ control, name: 'aiHistoryEnabled' });

  const currentAllocation = user?.targetAllocation ?? getAllocationTarget(user?.riskProfile ?? 'moderate', user?.investmentHorizon ?? 'medium');
  const previewAllocation = getAllocationTarget(riskProfile as RiskProfile, investmentHorizon as InvestmentHorizon);
  const allocationChanged = riskProfile !== user?.riskProfile || investmentHorizon !== user?.investmentHorizon;

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    const targetAllocation = getAllocationTarget(
      data.riskProfile as RiskProfile,
      data.investmentHorizon as InvestmentHorizon,
    );
    await updateUserProfile.execute(user.id, { ...data, targetAllocation });
    setUser({ ...user, ...data, targetAllocation, updatedAt: new Date() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logout.execute();
    navigate('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--blue-500), var(--ai-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 0 3px var(--bg-surface), 0 0 0 5px var(--blue-400)',
        }}>
          {initials}
        </div>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {user?.displayName || t('settings.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: 2 }}>{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Profile */}
            <SectionCard icon={<User size={14} strokeWidth={2} />} title={t('settings.profile')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  label={t('settings.displayName')}
                  placeholder={t('settings.displayNamePlaceholder')}
                  error={errors.displayName?.message}
                  {...register('displayName')}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('settings.email')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      value={user?.email ?? ''}
                      readOnly
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
                        borderRadius: '8px', padding: '0 14px 0 36px',
                        height: '40px', fontSize: '14px',
                        color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
                        outline: 'none', cursor: 'not-allowed',
                      }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Risk Profile */}
            <SectionCard icon={<Shield size={14} strokeWidth={2} />} title={t('settings.riskProfile')}>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { value: 'conservative', label: t('onboarding.conservative'), desc: 'Risiko rendah, return stabil' },
                  { value: 'moderate', label: t('onboarding.moderate'), desc: 'Keseimbangan risiko & return', badge: 'Populer' },
                  { value: 'aggressive', label: t('onboarding.aggressive'), desc: 'Risiko tinggi, return maksimal' },
                ] as const).map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={riskProfile === opt.value}
                    onClick={() => setValue('riskProfile', opt.value)}
                    label={opt.label}
                    description={opt.desc}
                    badge={'badge' in opt ? opt.badge : undefined}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Investment Horizon */}
            <SectionCard icon={<Clock size={14} strokeWidth={2} />} title={t('settings.horizon')}>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { value: 'short', label: t('onboarding.short'), desc: t('onboarding.shortDesc') },
                  { value: 'medium', label: t('onboarding.medium'), desc: t('onboarding.mediumDesc') },
                  { value: 'long', label: t('onboarding.long'), desc: t('onboarding.longDesc') },
                ] as const).map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={investmentHorizon === opt.value}
                    onClick={() => setValue('investmentHorizon', opt.value)}
                    label={opt.label}
                    description={opt.desc}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button type="submit" loading={isSubmitting}>
                <Save size={14} strokeWidth={2} style={{ marginRight: 6, display: 'inline' }} />
                {t('settings.saveChanges')}
              </Button>
              {saved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gain-400)', fontSize: '13px', fontWeight: 500 }}>
                  <Check size={14} strokeWidth={2.5} />
                  {t('settings.saved')}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Allocation simulation */}
            <AllocationSimulation
              current={currentAllocation}
              preview={previewAllocation}
              changed={allocationChanged}
            />

            {/* AI & Appearance */}
            <SectionCard icon={<Bot size={14} strokeWidth={2} />} title="AI & Tampilan">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* AI history toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t('settings.aiHistory')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 2 }}>{t('settings.aiHistoryDesc')}</p>
                  </div>
                  <Toggle checked={aiHistoryEnabled} onChange={(v) => setValue('aiHistoryEnabled', v)} />
                </div>
                <input type="hidden" {...register('aiHistoryEnabled')} />

                {/* Theme */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t('settings.theme')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 2 }}>
                      {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--border-default)' }}>
                    {(['dark', 'light'] as const).map((th) => (
                      <button key={th} type="button" onClick={() => { if (theme !== th) toggleTheme(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', borderRadius: 6, fontSize: '12px', fontWeight: 600,
                          border: 'none', cursor: 'pointer', transition: 'all 150ms',
                          background: theme === th ? 'var(--bg-surface)' : 'transparent',
                          color: theme === th ? 'var(--text-primary)' : 'var(--text-muted)',
                          boxShadow: theme === th ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                        }}
                      >
                        {th === 'dark' ? <Moon size={12} strokeWidth={2} /> : <Sun size={12} strokeWidth={2} />}
                        {th === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t('settings.language')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 2 }}>
                      {i18n.language === 'id' ? 'Bahasa Indonesia' : 'English'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--border-default)' }}>
                    {(['id', 'en'] as const).map((lang) => (
                      <button key={lang} type="button" onClick={() => handleLanguageChange(lang)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 6, fontSize: '12px', fontWeight: 700,
                          border: 'none', cursor: 'pointer', transition: 'all 150ms',
                          background: i18n.language === lang ? 'var(--bg-surface)' : 'transparent',
                          color: i18n.language === lang ? 'var(--text-primary)' : 'var(--text-muted)',
                          boxShadow: i18n.language === lang ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                        }}
                      >
                        <Globe size={11} strokeWidth={2} />
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Account / Logout */}
            <SectionCard icon={<User size={14} strokeWidth={2} />} title={t('settings.account')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--blue-500), var(--ai-accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff',
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.displayName}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button variant="danger" onClick={handleLogout} fullWidth>
                  <LogOut size={13} strokeWidth={2} style={{ marginRight: 6, display: 'inline' }} />
                  {t('auth.logout')}
                </Button>
              </div>
            </SectionCard>

          </div>
        </div>
      </form>
    </Layout>
  );
}
