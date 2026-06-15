import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../../data/firebase/config';
import { userRepository } from '../../../infrastructure/di/container';
import { getAllocationTarget } from '../../../shared/constants/allocationTargets';

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  // Create Firestore user document with defaults — onboarding will update risk/horizon/goal
  const now = new Date();
  await userRepository.create({
    id: credential.user.uid,
    email,
    displayName,
    riskProfile: 'moderate',
    investmentHorizon: 'medium',
    baseCurrency: 'IDR',
    targetAllocation: getAllocationTarget('moderate', 'medium'),
    aiHistoryEnabled: false,
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  });

  return credential;
}
