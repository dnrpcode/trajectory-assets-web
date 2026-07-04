import {
  signInWithEmailAndPassword,
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

export class FirebaseAuthService implements IAuthService {
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(user);
  }

  // Redirect-based sign-in for ALL platforms. signInWithPopup is unreliable:
  // it breaks on iOS Safari and in-app browsers (blocked window.open / third-party
  // cookies), and mixing popup+redirect caused auth/cancelled-popup-request.
  // Redirect always works; the tradeoff (full-page navigation on desktop) is fine.
  async signInWithGoogle(): Promise<{ user: AuthUser; isNew: boolean } | null> {
    await signInWithRedirect(auth, googleProvider);
    return null; // browser navigates away; result is read back via getGoogleRedirectResult()
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
