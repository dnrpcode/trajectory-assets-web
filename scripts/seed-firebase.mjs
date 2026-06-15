#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
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
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_EMAIL = 'test@trajectory.local';
const TEST_PASSWORD = 'Test123456!';
const TEST_USER_ID = 'test-user-demo';

function stripUndefined(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

async function seedData() {
  console.log('🌱 Starting Firebase seed...');

  try {
    // 1. Create or sign in test user
    let userId = TEST_USER_ID;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      await updateProfile(userCred.user, { displayName: 'Test Investor' });
      userId = userCred.user.uid;
      console.log('✓ Created test user:', TEST_EMAIL);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('✓ Signed in to existing user:', TEST_EMAIL);
      } else {
        throw err;
      }
    }

    // Get the actual user ID from auth
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Failed to authenticate');
    userId = currentUser.uid;

    const batch = writeBatch(db);

    // 2. Create User document
    const userDocRef = doc(db, 'users', userId);
    batch.set(userDocRef, {
      email: TEST_EMAIL,
      displayName: 'Test Investor',
      riskProfile: 'moderate',
      investmentHorizon: 'medium',
      onboardingComplete: true,
      targetAllocation: {
        saham: 40,
        reksa_dana: 20,
        obligasi_sbn: 15,
        emas: 10,
        kripto: 10,
        cash: 5,
        lainnya: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Create Assets & Entries
    const assets = [
      { name: 'BBCA', category: 'saham', platform: 'Stockbit' },
      { name: 'BMRI', category: 'saham', platform: 'Stockbit' },
      { name: 'Reksa Dana Balanced', category: 'reksa_dana', platform: 'Bibit' },
      { name: 'Obligasi SBN', category: 'obligasi_sbn', platform: 'Koinvest' },
      { name: 'Emas Antam', category: 'emas', platform: 'Antam' },
      { name: 'Bitcoin', category: 'kripto', platform: 'Indodax' },
    ];

    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    for (const asset of assets) {
      const assetId = `${userId}_${asset.name.toLowerCase().replace(/\s+/g, '_')}_${asset.category}`;

      // Create entries for this asset
      const entryIds = [];

      // Entry 1: new_position (2 months ago)
      const entry1Id = doc(collection(db, 'users', userId, 'entries')).id;
      entryIds.push(entry1Id);
      batch.set(doc(db, 'users', userId, 'entries', entry1Id), stripUndefined({
        id: entry1Id,
        userId,
        assetId,
        assetName: asset.name,
        ticker: asset.category === 'saham' ? asset.name : undefined,
        category: asset.category,
        platform: asset.platform,
        entryType: 'new_position',
        month: `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}`,
        pricePerUnit: Math.floor(Math.random() * 100000) + 10000,
        units: Math.floor(Math.random() * 100) + 5,
        currency: 'IDR',
        exchangeRateToIDR: 1,
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15),
        createdAt: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15),
        updatedAt: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15),
        isCorrected: false,
      }));

      // Entry 2: price_update (1 month ago)
      const entry2Id = doc(collection(db, 'users', userId, 'entries')).id;
      entryIds.push(entry2Id);
      batch.set(doc(db, 'users', userId, 'entries', entry2Id), stripUndefined({
        id: entry2Id,
        userId,
        assetId,
        assetName: asset.name,
        ticker: asset.category === 'saham' ? asset.name : undefined,
        category: asset.category,
        platform: asset.platform,
        entryType: 'price_update',
        month: `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}`,
        pricePerUnit: Math.floor(Math.random() * 100000) + 10000,
        currency: 'IDR',
        exchangeRateToIDR: 1,
        date: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 15),
        createdAt: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 15),
        updatedAt: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 15),
        isCorrected: false,
      }));

      // Entry 3: income (current month)
      const entry3Id = doc(collection(db, 'users', userId, 'entries')).id;
      entryIds.push(entry3Id);
      batch.set(doc(db, 'users', userId, 'entries', entry3Id), stripUndefined({
        id: entry3Id,
        userId,
        assetId,
        assetName: asset.name,
        ticker: asset.category === 'saham' ? asset.name : undefined,
        category: asset.category,
        platform: asset.platform,
        entryType: 'income',
        incomeFeeCategory: asset.category === 'saham' ? 'dividend' : 'coupon',
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        amount: Math.floor(Math.random() * 50000) + 5000,
        currency: 'IDR',
        exchangeRateToIDR: 1,
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 10),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 10),
        isCorrected: false,
      }));

      // Create Asset projection (computed from entries)
      const firstEntry = {
        id: entry1Id,
        pricePerUnit: Math.floor(Math.random() * 100000) + 10000,
        units: Math.floor(Math.random() * 100) + 5,
      };
      const totalUnits = firstEntry.units;
      const avgCostPerUnit = firstEntry.pricePerUnit;
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
        firstEntryDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15),
        lastUpdatedDate: new Date(now.getFullYear(), now.getMonth(), 10),
        projectionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    // 4. Create Portfolio History (monthly snapshots)
    let baseValue = 50000000; // Rp 50 juta
    for (let i = 2; i >= 0; i--) {
      const historyDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${historyDate.getFullYear()}-${String(historyDate.getMonth() + 1).padStart(2, '0')}`;
      const totalValue = baseValue + Math.random() * 10000000 - 5000000;
      baseValue = totalValue;

      batch.set(doc(db, 'users', userId, 'portfolioHistory', monthStr), {
        month: monthStr,
        totalValueIDR: totalValue,
        totalCostBasisIDR: totalValue * 0.85,
        unrealizedGainIDR: totalValue * 0.15,
        allocationActual: {
          saham: Math.random() * 40 + 30,
          reksa_dana: Math.random() * 20 + 10,
          obligasi_sbn: Math.random() * 20 + 10,
          emas: Math.random() * 15 + 5,
          kripto: Math.random() * 10 + 5,
          cash: Math.random() * 10 + 2,
          lainnya: 0,
        },
        createdAt: historyDate,
        updatedAt: historyDate,
      });
    }

    // Commit all writes
    await batch.commit();
    console.log('✓ Seed data created successfully!');
    console.log('\nTest credentials:');
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Password: ${TEST_PASSWORD}`);
    console.log('\nYou can now log in and see:');
    console.log('  • 6 assets (saham, reksa_dana, obligasi_sbn, emas, kripto)');
    console.log('  • Multiple entries (new_position, price_update, income)');
    console.log('  • Portfolio history (3 months of data)');
    console.log('  • Dashboard with allocation chart and wealth growth');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
