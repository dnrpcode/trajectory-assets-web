import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../data/firebase/config';

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
