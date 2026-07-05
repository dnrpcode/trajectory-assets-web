export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface IAuthService {
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<{ user: AuthUser; isNew: boolean }>;
  registerWithEmail(email: string, password: string, displayName: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
