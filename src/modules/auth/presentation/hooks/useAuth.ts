import { useEffect } from 'react';
import { authService, getUserById, loginWithGoogle, logout as logoutUseCase } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
export { useAuthStore } from '@/shared/hooks/useAuthStore';

export function useAuthBootstrap() {
  const { setUser, setAuthUser, setLoading } = useAuthStore();

  useEffect(() => {
    let settled = false;

    loginWithGoogle.completeRedirect().catch((e) => { 
      console.error('Error completing Google redirect',e);
    });
    const failsafe = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 15000);

    const unsubscribe = authService.onAuthStateChanged(async (au) => {
      setLoading(true);
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

export function useAuth() {
  const { user, authUser, loading, setUser, setAuthUser } = useAuthStore();

  const doLogout = async () => {
    await logoutUseCase.execute();
    setUser(null);
    setAuthUser(null);
  };

  return { user, authUser, loading, logout: doLogout };
}
