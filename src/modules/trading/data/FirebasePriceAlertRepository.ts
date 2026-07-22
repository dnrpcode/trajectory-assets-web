import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/data/firebase/config';
import type { IPriceAlertRepository } from '../domain/repositories/IPriceAlertRepository';
import type { PriceAlert, CreatePriceAlertInput } from '../domain/entities/PriceAlert';
import { stripUndefined } from '@/shared/utils/firestore';

export class FirebasePriceAlertRepository implements IPriceAlertRepository {
  private col(userId: string) {
    return collection(db, 'users', userId, 'priceAlerts');
  }

  async getByUserId(userId: string): Promise<PriceAlert[]> {
    const snap = await getDocs(this.col(userId));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId,
        coinId: data.coinId as string,
        coinSymbol: data.coinSymbol as string,
        coinName: data.coinName as string,
        metric: data.metric as PriceAlert['metric'],
        condition: data.condition as PriceAlert['condition'],
        threshold: data.threshold as number,
        active: data.active as boolean,
        triggeredAt: (data.triggeredAt as Timestamp | undefined)?.toDate(),
        triggeredValue: data.triggeredValue as number | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async create(input: CreatePriceAlertInput): Promise<void> {
    const ref = doc(this.col(input.userId));
    await setDoc(ref, stripUndefined({
      coinId: input.coinId,
      coinSymbol: input.coinSymbol,
      coinName: input.coinName,
      metric: input.metric,
      condition: input.condition,
      threshold: input.threshold,
      active: true,
      createdAt: Timestamp.fromDate(new Date()),
    }));
  }

  async markTriggered(userId: string, alertId: string, value: number): Promise<void> {
    const ref = doc(db, 'users', userId, 'priceAlerts', alertId);
    await updateDoc(ref, {
      active: false,
      triggeredAt: Timestamp.fromDate(new Date()),
      triggeredValue: value,
    });
  }

  async delete(userId: string, alertId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'priceAlerts', alertId));
  }
}
