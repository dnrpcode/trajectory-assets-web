import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import { User } from '@/modules/user/domain/entities/User';
import { IUserRepository } from '@/modules/user/domain/repositories/IUserRepository';
import { stripUndefined } from '@/shared/utils/firestore';

function toDate(v: unknown): Date {
  // Toleran: field bisa Timestamp (normal), atau hilang/beda bentuk kalau
  // dokumen sempat ditulis via merge tanpa timestamp lengkap.
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function fromFirestore(data: Record<string, unknown>): User {
  return {
    ...(data as Omit<User, 'createdAt' | 'updatedAt'>),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export class FirebaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const user = fromFirestore(snap.data() as Record<string, unknown>);
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
    // setDoc + merge (bukan updateDoc): updateDoc gagal kalau dokumen belum
    // ada, yang bisa terjadi kalau user-doc gagal dibuat saat register/Google
    // login. merge:true bikin dokumen kalau belum ada, update kalau sudah ada
    // — idempoten, tidak pernah throw not-found.
    await setDoc(ref, payload, { merge: true });
  }
}
