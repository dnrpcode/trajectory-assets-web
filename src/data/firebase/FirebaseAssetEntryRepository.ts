import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { AssetEntry } from '../../domain/entities/AssetEntry';
import { IAssetEntryRepository } from '../../domain/repositories/IAssetEntryRepository';
import { stripUndefined } from '../../shared/utils/firestore';

function fromFirestore(id: string, data: Record<string, unknown>): AssetEntry {
  return {
    ...(data as Omit<AssetEntry, 'id' | 'date' | 'createdAt' | 'updatedAt'>),
    id,
    date: (data.date as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

export class FirebaseAssetEntryRepository implements IAssetEntryRepository {
  private colRef(userId: string) {
    return collection(db, 'users', userId, 'entries');
  }

  async getByUserId(userId: string): Promise<AssetEntry[]> {
    const q = query(this.colRef(userId), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
  }

  async getByAssetId(userId: string, assetId: string): Promise<AssetEntry[]> {
    const q = query(this.colRef(userId), where('assetId', '==', assetId));
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
    return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async create(
    entry: Omit<AssetEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AssetEntry> {
    const now = new Date();
    const payload = stripUndefined({
      ...entry,
      date: Timestamp.fromDate(entry.date),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    } as Record<string, unknown>);
    const ref = await addDoc(this.colRef(entry.userId), payload);
    return { ...entry, id: ref.id, createdAt: now, updatedAt: now };
  }

  async markCorrected(userId: string, entryId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'entries', entryId);
    await updateDoc(ref, { isCorrected: true, updatedAt: Timestamp.fromDate(new Date()) });
  }

  async delete(userId: string, entryId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(ref);
  }

  async deleteByAssetId(userId: string, assetId: string): Promise<void> {
    const q = query(
      this.colRef(userId),
      where('assetId', '==', assetId),
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
}
