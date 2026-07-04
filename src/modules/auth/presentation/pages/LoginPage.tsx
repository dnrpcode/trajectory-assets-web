import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { loginWithEmail, loginWithGoogle, getUserById } from '@/infrastructure/di/container';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormValues = z.infer<typeof schema>;

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      setError('');
      const authUser = await loginWithEmail.execute(email, password);
      const user = await getUserById.execute(authUser.uid);
      navigate(user?.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.loginFailed'));
    }
  };

  const handleGoogle = async () => {
    try {
      setError('');
      const authUser = await loginWithGoogle.execute();
      if (!authUser) return; // redirect flow — page is navigating to Google now
      const user = await getUserById.execute(authUser.uid);
      navigate(user?.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <LogoMark />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ letterSpacing: 'var(--tracking-snug)' }}>Trajectory</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('auth.tagline')}</p>
          </div>
        </div>

        <div
          className="rounded-[var(--radius-xl)] p-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6" style={{ letterSpacing: 'var(--tracking-snug)' }}>
            {t('auth.loginTitle')}
          </h2>

          {error && (
            <div
              className="rounded-md px-4 py-3 text-sm mb-5"
              style={{ background: 'var(--loss-tint)', border: '1px solid rgba(240,71,106,0.22)', color: 'var(--loss-400)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} fullWidth size="lg" className="mt-2">
              {t('auth.login')}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }} />
            </div>
            <div
              className="relative flex justify-center text-xs px-2"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)' }}
            >
              {t('common.or')}
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleGoogle}
            fullWidth
            size="lg"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            {t('auth.loginWithGoogle')}
          </Button>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--blue-400)' }}>
              {t('auth.registerNow')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
