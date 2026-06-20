import { collection, getDocs, setDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import { IWatchlistRepository } from '../domain/repositories/IWatchlistRepository';
import { WatchlistCoin } from '../domain/entities/Watchlist';
import { stripUndefined } from '@/shared/utils/firestore';

export class FirebaseWatchlistRepository implements IWatchlistRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'watchlist');
  }

  async getAll(userId: string): Promise<WatchlistCoin[]> {
    const snap = await getDocs(this.col(userId));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        addedAt: data.addedAt?.toDate() ?? new Date(),
      } as WatchlistCoin;
    });
  }

  async add(userId: string, coin: WatchlistCoin): Promise<void> {
    const ref = doc(db, 'users', userId, 'watchlist', coin.coinId);
    await setDoc(ref, stripUndefined({
      ...coin,
      addedAt: Timestamp.fromDate(coin.addedAt),
    }));
  }

  async remove(userId: string, coinId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'watchlist', coinId);
    await deleteDoc(ref);
  }
}
