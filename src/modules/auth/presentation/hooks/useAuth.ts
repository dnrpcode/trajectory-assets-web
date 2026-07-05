import { useEffect } from 'react';
import { authService, getUserById, loginWithGoogle, logout as logoutUseCase } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export { useAuthStore } from '@/shared/hooks/useAuthStore';

/**
 * Subscribes to Firebase auth state ONCE for the whole app. Call this exactly
 * once, at the top of AppRoutes (which itself only ever renders once — unlike
 * AuthGuard/OnboardingGuard, which mount per-route). Previously every guard
 * called what is now useAuth() and each one independently subscribed its own
 * onAuthStateChanged + ran its own getUserById(uid) read for the same user,
 * racing each other into the shared store. That's what caused email login to
 * sometimes hang on a spinner instead of reaching the dashboard.
 */
export function useAuthBootstrap() {
  const { setUser, setAuthUser, setLoading } = useAuthStore();

  useEffect(() => {
    let settled = false;

    // Selesaikan pending Google signInWithRedirect() — fire-and-forget, hasil
    // akhirnya tetap lewat onAuthStateChanged di bawah.
    loginWithGoogle.completeRedirect().catch(() => { /* diselesaikan oleh onAuthStateChanged */ });

    // Fail-safe murni anti-infinite-spinner. TIDAK menebak status onboarding —
    // kalau ini benar-benar terpicu (Firestore total tidak bisa dihubungi),
    // guard akan melihat user=null dan authUser sesuai apa adanya, bukan
    // dipaksa "belum onboarding". Ini beda dari fix sebelumnya yang me-race
    // getUserById dengan timeout 6 detik dan salah menandai user existing
    // sebagai belum onboarding setiap kali Firestore lambat (bug nyata).
    const failsafe = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 15000);

    const unsubscribe = authService.onAuthStateChanged(async (au) => {
      setAuthUser(au);
      if (au) {
        try {
          const domainUser = await getUserById.execute(au.uid);
          setUser(domainUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      settled = true;
      clearTimeout(failsafe);
      setLoading(false);
    });

    return () => { clearTimeout(failsafe); unsubscribe(); };
  }, [setUser, setAuthUser, setLoading]);
}

/** Pure reader — safe to call from as many components as needed (no subscriptions). */
export function useAuth() {
  const { user, authUser, loading, setUser, setAuthUser } = useAuthStore();

  const doLogout = async () => {
    await logoutUseCase.execute();
    setUser(null);
    setAuthUser(null);
  };

  return { user, authUser, loading, logout: doLogout };
}
