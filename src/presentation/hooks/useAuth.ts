import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../../data/firebase/config';
import { userRepository } from '../../infrastructure/di/container';
import { User } from '../../domain/entities/User';

interface AuthState {
  user: User | null;
  firebaseUser: import('firebase/auth').User | null;
  /** True while Firebase auth state AND Firestore user doc are both resolving */
  loading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (u: import('firebase/auth').User | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),
}));

export function useAuth() {
  const { user, firebaseUser, loading, setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Keep loading=true until both auth + Firestore resolve
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const domainUser = await userRepository.getById(fbUser.uid);
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
  }, [setUser, setFirebaseUser, setLoading]);

  const logout = async () => {
    await signOut(auth);
    // Reset local state immediately
    setUser(null);
    setFirebaseUser(null);
  };

  return { user, firebaseUser, loading, logout };
}
