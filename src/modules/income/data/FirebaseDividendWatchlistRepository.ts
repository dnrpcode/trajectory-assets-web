import { collection, getDocs, setDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import type { IDividendWatchlistRepository } from '../domain/repositories/IDividendWatchlistRepository';
import type { WatchlistEntry } from '../domain/entities/Dividend';
import { stripUndefined } from '@/shared/utils/firestore';

export class FirebaseDividendWatchlistRepository implements IDividendWatchlistRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'dividendWatchlist');
  }

  async getAll(userId: string): Promise<WatchlistEntry[]> {
    const snap = await getDocs(this.col(userId));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId,
        ticker: data.ticker as string,
        addedAt: (data.addedAt as Timestamp).toDate(),
      };
    });
  }

  async add(userId: string, ticker: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'dividendWatchlist', ticker.toUpperCase());
    await setDoc(ref, stripUndefined({ ticker: ticker.toUpperCase(), addedAt: Timestamp.fromDate(new Date()) }));
  }

  async remove(userId: string, ticker: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'dividendWatchlist', ticker.toUpperCase());
    await deleteDoc(ref);
  }
}
