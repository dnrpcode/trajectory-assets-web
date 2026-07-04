export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface IAuthService {
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  /** Returns null on mobile — redirect flow navigates away; result comes back via getGoogleRedirectResult(). */
  signInWithGoogle(): Promise<{ user: AuthUser; isNew: boolean } | null>;
  /** Completes a pending signInWithRedirect(). Returns null if there was no redirect in flight. */
  getGoogleRedirectResult(): Promise<{ user: AuthUser; isNew: boolean } | null>;
  registerWithEmail(email: string, password: string, displayName: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
