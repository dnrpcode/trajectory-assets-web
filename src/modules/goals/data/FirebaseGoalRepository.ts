import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, Timestamp } from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import type { Goal } from '@/modules/goals/domain/entities/Goal';
import { IGoalRepository, CreateGoalInput, UpdateGoalInput } from '@/modules/goals/domain/repositories/IGoalRepository';
import { stripUndefined } from '@/shared/utils/firestore';

// targetDate historis bisa berupa string "YYYY-MM-DD" (ditulis onboarding lama)
// atau Timestamp — normalisasi keduanya ke Date.
function toDateOrUndefined(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') return new Date(v + 'T12:00:00');
  return undefined;
}

export class FirebaseGoalRepository implements IGoalRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'goals');
  }

  async getByUserId(userId: string): Promise<Goal[]> {
    const snap = await getDocs(this.col(userId));
    const goals = snap.docs.map((d): Goal => {
      const data = d.data();
      return {
        id: d.id,
        userId,
        name: (data.name as string | undefined) ?? undefined,
        targetAmountIDR: (data.targetAmountIDR as number) ?? 0,
        targetDate: toDateOrUndefined(data.targetDate),
        monthlyContributionIDR: (data.monthlyContributionIDR as number | undefined) ?? undefined,
        description: (data.description as string | undefined) ?? undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
      };
    });
    return goals.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async create(input: CreateGoalInput): Promise<void> {
    const ref = doc(this.col(input.userId));
    await setDoc(ref, stripUndefined({
      id: ref.id,
      userId: input.userId,
      name: input.name,
      targetAmountIDR: input.targetAmountIDR,
      targetDate: input.targetDate,
      monthlyContributionIDR: input.monthlyContributionIDR,
      description: input.description,
      createdAt: Timestamp.fromDate(input.createdAt),
      updatedAt: Timestamp.fromDate(input.updatedAt),
    }));
  }

  async update(userId: string, goalId: string, input: UpdateGoalInput): Promise<void> {
    const ref = doc(db, 'users', userId, 'goals', goalId);
    // Full replace atas field editable — opsional yang kosong dihapus dari dokumen
    await updateDoc(ref, {
      name: input.name ?? deleteField(),
      targetAmountIDR: input.targetAmountIDR,
      targetDate: input.targetDate ?? deleteField(),
      monthlyContributionIDR: input.monthlyContributionIDR ?? deleteField(),
      description: input.description ?? deleteField(),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  async delete(userId: string, goalId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  }
}
