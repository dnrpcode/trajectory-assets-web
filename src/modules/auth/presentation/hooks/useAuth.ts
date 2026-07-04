import { useEffect } from 'react';
import { authService, getUserById, loginWithGoogle, logout as logoutUseCase } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export { useAuthStore } from '@/shared/hooks/useAuthStore';

export function useAuth() {
  const { user, authUser, loading, setUser, setAuthUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Selesaikan pending Google signInWithRedirect() di sini — di root — bukan di
    // LoginPage. AppRoutes hanya render <FullPageSpinner/> selama loading, jadi
    // LoginPage tidak pernah ter-mount untuk memanggil getRedirectResult(); tanpa
    // itu, onAuthStateChanged iOS bisa tertunda selamanya → stuck loading.
    // Fire-and-forget: onAuthStateChanged di bawah yang menyelesaikan loading state.
    loginWithGoogle.completeRedirect().catch(() => { /* ditangani oleh onAuthStateChanged */ });

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
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setAuthUser, setLoading]);

  const doLogout = async () => {
    await logoutUseCase.execute();
    setUser(null);
    setAuthUser(null);
  };

  return { user, authUser, loading, logout: doLogout };
}
