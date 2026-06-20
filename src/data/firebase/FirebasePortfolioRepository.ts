import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './config';
import { PortfolioHistoryPoint } from '../../domain/entities/Portfolio';
import { IPortfolioRepository } from '../../domain/repositories/IPortfolioRepository';
import { stripUndefined } from '../../shared/utils/firestore';

export class FirebasePortfolioRepository implements IPortfolioRepository {
  private colRef(userId: string) {
    return collection(db, 'users', userId, 'portfolioHistory');
  }

  async getHistory(userId: string): Promise<PortfolioHistoryPoint[]> {
    const snap = await getDocs(this.colRef(userId));
    return snap.docs
      .map((d) => d.data() as PortfolioHistoryPoint)
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async saveHistoryPoint(userId: string, point: PortfolioHistoryPoint): Promise<void> {
    const ref = doc(db, 'users', userId, 'portfolioHistory', point.month);
    await setDoc(ref, stripUndefined(point as unknown as Record<string, unknown>));
  }
}
