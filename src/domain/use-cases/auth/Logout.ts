import { signOut } from 'firebase/auth';
import { auth } from '../../../data/firebase/config';

export async function logout() {
  return signOut(auth);
}
