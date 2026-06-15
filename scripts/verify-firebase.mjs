#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
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

async function verifyData() {
  console.log('🔍 Verifying Firebase data...\n');

  try {
    const TEST_EMAIL = 'test@trajectory.local';

    // Check users collection
    console.log('📁 Checking /users collection...');
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`   Found ${usersSnap.docs.length} user(s)\n`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`👤 User: ${userData.displayName} (${userData.email})`);
      console.log(`   UID: ${userId}`);
      console.log(`   Onboarding: ${userData.onboardingComplete ? '✓' : '✗'}`);

      // Check assets
      console.log(`\n   📊 Assets:`);
      const assetsSnap = await getDocs(collection(db, `users/${userId}/assets`));
      console.log(`      Found ${assetsSnap.docs.length} assets`);

      for (const assetDoc of assetsSnap.docs) {
        const asset = assetDoc.data();
        console.log(`      • ${asset.assetName} (${asset.category}) - Rp ${asset.currentValueIDR?.toLocaleString('id-ID') || '0'}`);
      }

      // Check entries
      console.log(`\n   📝 Entries:`);
      const entriesSnap = await getDocs(collection(db, `users/${userId}/entries`));
      console.log(`      Found ${entriesSnap.docs.length} entries`);

      const entryTypes = {};
      for (const entryDoc of entriesSnap.docs) {
        const entry = entryDoc.data();
        entryTypes[entry.entryType] = (entryTypes[entry.entryType] || 0) + 1;
      }
      for (const [type, count] of Object.entries(entryTypes)) {
        console.log(`      • ${type}: ${count}`);
      }

      // Check portfolio history
      console.log(`\n   📈 Portfolio History:`);
      const historySnap = await getDocs(collection(db, `users/${userId}/portfolioHistory`));
      console.log(`      Found ${historySnap.docs.length} months`);

      const months = historySnap.docs
        .map(doc => ({ month: doc.id, value: doc.data().totalValueIDR }))
        .sort((a, b) => a.month.localeCompare(b.month));

      for (const { month, value } of months) {
        console.log(`      • ${month}: Rp ${value?.toLocaleString('id-ID') || '0'}`);
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }

    if (usersSnap.docs.length === 0) {
      console.log('⚠️  No users found. Run: npm run seed\n');
    } else {
      console.log('✅ Data verification complete!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyData();
