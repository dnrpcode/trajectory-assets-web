import { useEffect } from 'react';
import { authService, getUserById, loginWithGoogle, logout as logoutUseCase } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export { useAuthStore } from '@/shared/hooks/useAuthStore';

// useAuth mounts in several components (AppRoutes + guards). This module-level
// flag makes sure the pending redirect is resolved exactly once, not once per
// mount — concurrent getRedirectResult() calls can race and duplicate work.
let redirectCompletionStarted = false;

export function useAuth() {
  const { user, authUser, loading, setUser, setAuthUser, setLoading } = useAuthStore();

  useEffect(() => {
    let settled = false;

    // Selesaikan pending Google signInWithRedirect() di sini — di root — bukan di
    // LoginPage. AppRoutes hanya render <FullPageSpinner/> selama loading, jadi
    // LoginPage tidak pernah ter-mount untuk memanggil getRedirectResult(); tanpa
    // itu, onAuthStateChanged iOS bisa tertunda selamanya → stuck loading.
    // Fire-and-forget: onAuthStateChanged di bawah yang menyelesaikan loading state.
    if (!redirectCompletionStarted) {
      redirectCompletionStarted = true;
      loginWithGoogle.completeRedirect().catch(() => { /* ditangani oleh onAuthStateChanged */ });
    }

    // Fail-safe: apa pun yang terjadi, jangan biarkan app terjebak di spinner
    // selamanya. Kalau onAuthStateChanged tak kunjung fire (mis. SDK auth hang
    // di iOS Safari), lepas loading setelah 8 detik supaya user tidak stuck.
    const failsafe = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 8000);

    const unsubscribe = authService.onAuthStateChanged(async (au) => {
      setAuthUser(au);
      if (au) {
        try {
          // Race getUserById dengan timeout — kalau baca Firestore menggantung,
          // jangan sampai loading ikut menggantung selamanya.
          const domainUser = await Promise.race([
            getUserById.execute(au.uid),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
          ]);
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

  const doLogout = async () => {
    await logoutUseCase.execute();
    setUser(null);
    setAuthUser(null);
  };

  return { user, authUser, loading, logout: doLogout };
}
