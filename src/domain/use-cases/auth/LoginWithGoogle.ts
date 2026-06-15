import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../data/firebase/config';
import { userRepository } from '../../../infrastructure/di/container';
import { getAllocationTarget } from '../../../shared/constants/allocationTargets';

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const { user } = credential;

  // Create Firestore document on first Google login
  const existing = await userRepository.getById(user.uid);
  if (!existing) {
    const now = new Date();
    await userRepository.create({
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email ?? '',
      riskProfile: 'moderate',
      investmentHorizon: 'medium',
      baseCurrency: 'IDR',
      targetAllocation: getAllocationTarget('moderate', 'medium'),
      aiHistoryEnabled: false,
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return credential;
}
