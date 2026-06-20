import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/data/firebase/config';
import { IAuthService, AuthUser } from '@/modules/user/domain/repositories/IAuthService';

function toAuthUser(fbUser: { uid: string; email: string | null; displayName: string | null }): AuthUser {
  return { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName };
}

export class FirebaseAuthService implements IAuthService {
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(user);
  }

  async signInWithGoogle(): Promise<{ user: AuthUser; isNew: boolean }> {
    const credential = await signInWithPopup(auth, googleProvider);
    const isNew = credential.operationType === 'signIn' &&
      credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime;
    return { user: toAuthUser(credential.user), isNew };
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
