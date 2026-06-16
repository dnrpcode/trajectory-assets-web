import { useEffect } from 'react';
import { create } from 'zustand';
import { authService, getUserById, logout as logoutUseCase } from '../../infrastructure/di/container';
import { User } from '../../domain/entities/User';
import { AuthUser } from '../../domain/repositories/IAuthService';

interface AuthState {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setAuthUser: (u: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setAuthUser: (authUser) => set({ authUser }),
  setLoading: (loading) => set({ loading }),
}));

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
