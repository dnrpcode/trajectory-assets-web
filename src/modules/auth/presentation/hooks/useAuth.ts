import { useEffect } from 'react';
import { authService, getUserById, logout as logoutUseCase } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export { useAuthStore } from '@/shared/hooks/useAuthStore';

export function useAuth() {
  const { user, authUser, loading, setUser, setAuthUser, setLoading } = useAuthStore();

  useEffect(() => {
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
