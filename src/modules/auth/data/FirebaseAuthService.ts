import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/data/firebase/config';
import { IAuthService, AuthUser } from '@/shared/types/auth';

function toAuthUser(fbUser: { uid: string; email: string | null; displayName: string | null }): AuthUser {
  return { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName };
}

function toResult(credential: UserCredential): { user: AuthUser; isNew: boolean } {
  const isNew = credential.operationType === 'signIn' &&
    credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime;
  return { user: toAuthUser(credential.user), isNew };
}

// signInWithPopup relies on third-party cookies + window.open, which iOS Safari
// (and in-app browsers like Instagram/WhatsApp) routinely block or kill mid-flow.
// Redirect-based sign-in is the reliable path there.
function isMobileOrInApp(): boolean {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod|Android/i.test(ua);
}

export class FirebaseAuthService implements IAuthService {
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(user);
  }

  async signInWithGoogle(): Promise<{ user: AuthUser; isNew: boolean } | null> {
    if (isMobileOrInApp()) {
      await signInWithRedirect(auth, googleProvider);
      return null; // browser navigates away; result is read back via getGoogleRedirectResult()
    }
    const credential = await signInWithPopup(auth, googleProvider);
    return toResult(credential);
  }

  async getGoogleRedirectResult(): Promise<{ user: AuthUser; isNew: boolean } | null> {
    const credential = await getRedirectResult(auth);
    return credential ? toResult(credential) : null;
  }

  async registerWithEmail(email: string, password: string, displayName: string): Promise<AuthUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    return toAuthUser(user);
  }

  async signOut(): Promise<void> {
    return signOut(auth);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (fbUser) =>
      callback(fbUser ? toAuthUser(fbUser) : null),
    );
  }
}
