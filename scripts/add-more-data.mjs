#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { config } from 'dotenv';

config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function stripUndefined(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

async function addMoreData(userId) {
  console.log(`\n📝 Adding more data to user: ${userId}\n`);

  try {
    const batch = writeBatch(db);
    const now = new Date();

    // Add more assets
    const moreAssets = [
      { name: 'TLKM', category: 'saham', platform: 'Stockbit' },
      { name: 'ASII', category: 'saham', platform: 'Stockbit' },
      { name: 'Reksa Dana Growth', category: 'reksa_dana', platform: 'Bibit' },
      { name: 'Obligasi Corporate', category: 'obligasi_sbn', platform: 'Koinvest' },
      { name: 'Ethereum', category: 'kripto', platform: 'Indodax' },
    ];

    let entryCount = 0;

    for (const asset of moreAssets) {
      const assetId = `${userId}_${asset.name.toLowerCase().replace(/\s+/g, '_')}_${asset.category}`;

      // Create entries
      for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
        const entryDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
        const monthStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        const entryId = doc(collection(db, 'users', userId, 'entries')).id;

        const entryTypes = monthOffset === 2 ? 'new_position' : monthOffset === 1 ? 'price_update' : 'income';

        const entryData = {
          id: entryId,
          userId,
          assetId,
          assetName: asset.name,
          ticker: asset.category === 'saham' ? asset.name : undefined,
          category: asset.category,
          platform: asset.platform,
          entryType: entryTypes,
          month: monthStr,
          currency: 'IDR',
          exchangeRateToIDR: 1,
          date: entryDate,
          createdAt: entryDate,
          updatedAt: entryDate,
          isCorrected: false,
        };

        if (entryTypes === 'new_position') {
          entryData.pricePerUnit = Math.floor(Math.random() * 100000) + 10000;
          entryData.units = Math.floor(Math.random() * 100) + 5;
        } else if (entryTypes === 'price_update') {
          entryData.pricePerUnit = Math.floor(Math.random() * 100000) + 10000;
        } else {
          entryData.amount = Math.floor(Math.random() * 50000) + 5000;
          entryData.incomeFeeCategory = asset.category === 'saham' ? 'dividend' : 'coupon';
        }

        batch.set(doc(db, 'users', userId, 'entries', entryId), stripUndefined(entryData));
        entryCount++;
      }

      // Create Asset
      const totalUnits = Math.floor(Math.random() * 100) + 5;
      const avgCostPerUnit = Math.floor(Math.random() * 100000) + 10000;
      const totalCostBasisIDR = totalUnits * avgCostPerUnit;
      const currentPricePerUnit = Math.floor(Math.random() * 100000) + 10000;
      const currentValueIDR = totalUnits * currentPricePerUnit;
      const unrealizedGainIDR = currentValueIDR - totalCostBasisIDR;
      const unrealizedGainPct = (unrealizedGainIDR / totalCostBasisIDR) * 100;

      batch.set(doc(db, 'users', userId, 'assets', assetId), stripUndefined({
        id: assetId,
        userId,
        assetName: asset.name,
        ticker: asset.category === 'saham' ? asset.name : undefined,
        category: asset.category,
        status: 'active',
        currency: 'IDR',
        platform: asset.platform,
        totalUnits,
        avgCostPerUnit,
        totalCostBasisIDR,
        currentPricePerUnit,
        currentValueIDR,
        isStale: false,
        unrealizedGainIDR,
        unrealizedGainPct,
        realizedGainIDR: 0,
        totalIncomeIDR: Math.floor(Math.random() * 50000) + 5000,
        totalFeesIDR: 0,
        firstEntryDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        lastUpdatedDate: new Date(now.getFullYear(), now.getMonth(), 10),
        projectionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    // Add more portfolio history
    let baseValue = 45000000;
    for (let i = 5; i >= 0; i--) {
      const historyDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${historyDate.getFullYear()}-${String(historyDate.getMonth() + 1).padStart(2, '0')}`;
      const totalValue = baseValue + Math.random() * 15000000 - 7500000;
      baseValue = totalValue;

      batch.set(doc(db, 'users', userId, 'portfolioHistory', monthStr), {
        month: monthStr,
        totalValueIDR: totalValue,
        totalCostBasisIDR: totalValue * 0.80,
        unrealizedGainIDR: totalValue * 0.20,
        allocationActual: {
          saham: Math.random() * 40 + 25,
          reksa_dana: Math.random() * 25 + 15,
          obligasi_sbn: Math.random() * 20 + 10,
          emas: Math.random() * 15 + 5,
          kripto: Math.random() * 15 + 5,
          cash: Math.random() * 10 + 2,
          lainnya: 0,
        },
        createdAt: historyDate,
        updatedAt: historyDate,
      });
    }

    await batch.commit();

    console.log('✅ Data added successfully!');
    console.log(`\n📊 Added:`);
    console.log(`  • New assets: 5 (TLKM, ASII, Reksa Dana Growth, Obligasi Corporate, Ethereum)`);
    console.log(`  • New entries: ${entryCount}`);
    console.log(`  • Portfolio history: 6 months`);
    console.log(`\n✨ Total now: 11 assets with comprehensive history\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npm run add-data <userId>');
  console.error('Example: npm run add-data GZoWUjiyC7gYFwVYv6s1oLoDf3g1');
  process.exit(1);
}

addMoreData(userId);
