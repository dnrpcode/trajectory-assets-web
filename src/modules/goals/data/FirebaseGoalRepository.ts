import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import { IGoalRepository, CreateGoalInput } from '@/modules/goals/domain/repositories/IGoalRepository';
import { stripUndefined } from '@/shared/utils/firestore';

export class FirebaseGoalRepository implements IGoalRepository {
  async create(input: CreateGoalInput): Promise<void> {
    const ref = doc(collection(db, 'users', input.userId, 'goals'));
    await setDoc(ref, stripUndefined({
      id: ref.id,
      userId: input.userId,
      targetAmountIDR: input.targetAmountIDR,
      targetDate: input.targetDate,
      monthlyContributionIDR: input.monthlyContributionIDR,
      createdAt: Timestamp.fromDate(input.createdAt),
      updatedAt: Timestamp.fromDate(input.updatedAt),
    }));
  }
}
