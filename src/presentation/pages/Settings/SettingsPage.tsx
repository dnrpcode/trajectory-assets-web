import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../hooks/useAuth';
import { useThemeContext } from '../../contexts/ThemeContext';
import { userRepository } from '../../../infrastructure/di/container';
import { getAllocationTarget } from '../../../shared/constants/allocationTargets';
import { RiskProfile, InvestmentHorizon } from '../../../shared/types';
import { logout } from '../../../domain/use-cases/auth/Logout';

const schema = z.object({
  displayName: z.string().min(2, 'Minimal 2 karakter'),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  aiHistoryEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: '6px',
  padding: '0 14px',
  height: '40px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c738f' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
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

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      displayName: user?.displayName ?? '',
      riskProfile: user?.riskProfile ?? 'moderate',
      investmentHorizon: user?.investmentHorizon ?? 'medium',
      aiHistoryEnabled: user?.aiHistoryEnabled ?? false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    const targetAllocation = getAllocationTarget(
      data.riskProfile as RiskProfile,
      data.investmentHorizon as InvestmentHorizon,
    );
    await userRepository.update(user.id, { ...data, targetAllocation });
    setUser({ ...user, ...data, targetAllocation, updatedAt: new Date() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>{t('settings.subtitle')}</p>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile */}
        <SectionCard title={t('settings.profile')}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label={t('settings.displayName')}
              placeholder={t('settings.displayNamePlaceholder')}
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <div>
              <label style={labelStyle}>{t('settings.email')}</label>
              <input
                value={user?.email ?? ''}
                readOnly
                style={{
                  width: '100%',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '6px',
                  padding: '0 14px',
                  height: '40px',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>{t('settings.riskProfile')}</label>
              <select {...register('riskProfile')} style={selectStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <option value="conservative" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.conservative')}</option>
                <option value="moderate" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.moderate')}</option>
                <option value="aggressive" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.aggressive')}</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>{t('settings.horizon')}</label>
              <select {...register('investmentHorizon')} style={selectStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <option value="short" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.short')} ({t('onboarding.shortDesc')})</option>
                <option value="medium" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.medium')} ({t('onboarding.mediumDesc')})</option>
                <option value="long" style={{ background: 'var(--bg-raised)' }}>{t('onboarding.long')} ({t('onboarding.longDesc')})</option>
              </select>
            </div>

            {/* AI History toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div>
                <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t('settings.aiHistory')}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: 2 }}>
                  {t('settings.aiHistoryDesc')}
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                <input type="checkbox" {...register('aiHistoryEnabled')} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                <div style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-default)',
                  position: 'relative', transition: 'all 200ms',
                }} className="peer peer-checked:bg-[var(--blue-500)] peer-checked:border-[var(--blue-400)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:after:translate-x-[18px]" />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <Button type="submit" loading={isSubmitting}>
                {t('settings.saveChanges')}
              </Button>
              {saved && (
                <span style={{ color: 'var(--gain-400)', fontSize: '13px', fontWeight: 500 }}>{t('settings.saved')}</span>
              )}
            </div>
          </form>
        </SectionCard>

        {/* Account */}
        <SectionCard title={t('settings.account')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              {t('settings.loggedInAs')} <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.email}</span>
            </p>
            <div>
              <Button variant="danger" onClick={handleLogout}>
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Preferences: Language + Theme */}
        <SectionCard title={t('settings.language') + ' & ' + t('settings.theme')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Language toggle */}
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {t('settings.language')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['id', 'en'] as const).map((lang) => {
                  const active = i18n.language === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      style={{
                        padding: '6px 20px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        background: active ? 'var(--blue-500)' : 'var(--bg-raised)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        borderColor: active ? 'transparent' : 'var(--border-default)',
                        transition: 'all 150ms',
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme toggle */}
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {t('settings.theme')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['dark', 'light'] as const).map((th) => {
                  const active = theme === th;
                  return (
                    <button
                      key={th}
                      onClick={() => { if (!active) toggleTheme(); }}
                      style={{
                        padding: '6px 20px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        background: active ? 'var(--blue-500)' : 'var(--bg-raised)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        borderColor: active ? 'transparent' : 'var(--border-default)',
                        transition: 'all 150ms',
                      }}
                    >
                      {th === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}
