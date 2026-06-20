import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import type { IIncomeEventRepository } from '../domain/repositories/IIncomeEventRepository';
import type { IncomeEvent } from '../domain/entities/IncomeEvent';
import { stripUndefined } from '@/shared/utils/firestore';

function toEvent(data: Record<string, unknown>): IncomeEvent {
  return {
    ...data,
    paymentDate: (data.paymentDate as Timestamp).toDate(),
    exDate: data.exDate ? (data.exDate as Timestamp).toDate() : undefined,
    createdAt: (data.createdAt as Timestamp).toDate(),
  } as IncomeEvent;
}

export class FirebaseIncomeEventRepository implements IIncomeEventRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'incomeEvents');
  }

  async getAll(userId: string): Promise<IncomeEvent[]> {
    const snap = await getDocs(this.col(userId));
    return snap.docs.map((d) => toEvent(d.data() as Record<string, unknown>));
  }

  async save(event: IncomeEvent): Promise<void> {
    const ref = doc(db, 'users', event.userId, 'incomeEvents', event.id);
    await setDoc(
      ref,
      stripUndefined({
        ...event,
        paymentDate: Timestamp.fromDate(event.paymentDate),
        exDate: event.exDate ? Timestamp.fromDate(event.exDate) : undefined,
        createdAt: Timestamp.fromDate(event.createdAt),
      }),
    );
  }

  async delete(userId: string, eventId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'incomeEvents', eventId);
    await deleteDoc(ref);
  }

  async markReceived(userId: string, eventId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'incomeEvents', eventId);
    await updateDoc(ref, { status: 'received' });
  }
}
