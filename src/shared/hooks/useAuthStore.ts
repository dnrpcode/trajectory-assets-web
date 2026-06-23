import { create } from 'zustand';
import type { User } from '@/shared/types/user';
import type { AuthUser } from '@/shared/types/auth';

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
