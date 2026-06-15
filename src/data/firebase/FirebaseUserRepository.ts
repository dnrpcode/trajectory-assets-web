import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { stripUndefined } from '../../shared/utils/firestore';

function fromFirestore(data: Record<string, unknown>): User {
  return {
    ...(data as Omit<User, 'createdAt' | 'updatedAt'>),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

export class FirebaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const user = fromFirestore(snap.data() as Record<string, unknown>);
    // Ensure id is set from document ID
    return { ...user, id: snap.id };
  }

  async create(user: User): Promise<void> {
    const ref = doc(db, 'users', user.id);
    const payload = stripUndefined({
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
    } as Record<string, unknown>);
    await setDoc(ref, payload);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const ref = doc(db, 'users', id);
    const payload = stripUndefined({
      ...data,
      updatedAt: Timestamp.fromDate(new Date()),
    } as Record<string, unknown>);
    await updateDoc(ref, payload);
  }
}
