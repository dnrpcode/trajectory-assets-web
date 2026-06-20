import { collection, getDocs, setDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './config';
import { IPaperTradeRepository } from '../../domain/repositories/IPaperTradeRepository';
import { PaperTrade } from '../../domain/entities/PaperTrade';

function toTrade(data: Record<string, unknown>): PaperTrade {
  return {
    ...data,
    date: (data.date as { toDate(): Date })?.toDate?.() ?? new Date(data.date as string),
    createdAt: (data.createdAt as { toDate(): Date })?.toDate?.() ?? new Date(data.createdAt as string),
  } as PaperTrade;
}

export class FirebasePaperTradeRepository implements IPaperTradeRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'paperTrades');
  }

  async getByUserId(userId: string): Promise<PaperTrade[]> {
    const snap = await getDocs(this.col(userId));
    return snap.docs.map((d) => toTrade(d.data() as Record<string, unknown>));
  }

  async getByCoinId(userId: string, coinId: string): Promise<PaperTrade[]> {
    const q = query(this.col(userId), where('coinId', '==', coinId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => toTrade(d.data() as Record<string, unknown>))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async save(trade: PaperTrade): Promise<void> {
    const ref = doc(db, 'users', trade.userId, 'paperTrades', trade.id);
    await setDoc(ref, trade);
  }

  async delete(userId: string, tradeId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'paperTrades', tradeId);
    await deleteDoc(ref);
  }
}
