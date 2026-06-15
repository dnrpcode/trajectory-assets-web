import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Asset } from '../../domain/entities/Asset';
import { IAssetProjectionRepository } from '../../domain/repositories/IAssetProjectionRepository';
import { stripUndefined } from '../../shared/utils/firestore';

function fromFirestore(id: string, data: Record<string, unknown>): Asset {
  return {
    ...(data as Omit<Asset, 'id' | 'firstEntryDate' | 'lastUpdatedDate' | 'updatedAt'>),
    id,
    totalFeesIDR: (data.totalFeesIDR as number) ?? 0,
    firstEntryDate: (data.firstEntryDate as Timestamp).toDate(),
    lastUpdatedDate: (data.lastUpdatedDate as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

export class FirebaseAssetProjectionRepository implements IAssetProjectionRepository {
  private colRef(userId: string) {
    return collection(db, 'users', userId, 'assets');
  }

  async getByUserId(userId: string): Promise<Asset[]> {
    const snap = await getDocs(this.colRef(userId));
    return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
  }

  async getById(userId: string, assetId: string): Promise<Asset | null> {
    const ref = doc(db, 'users', userId, 'assets', assetId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data() as Record<string, unknown>);
  }

  async save(asset: Asset): Promise<void> {
    const ref = doc(db, 'users', asset.userId, 'assets', asset.id);
    const payload = stripUndefined({
      ...asset,
      firstEntryDate: Timestamp.fromDate(asset.firstEntryDate),
      lastUpdatedDate: Timestamp.fromDate(asset.lastUpdatedDate),
      updatedAt: Timestamp.fromDate(asset.updatedAt),
    } as Record<string, unknown>);
    await setDoc(ref, payload);
  }

  async delete(userId: string, assetId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'assets', assetId);
    await deleteDoc(ref);
  }
}
