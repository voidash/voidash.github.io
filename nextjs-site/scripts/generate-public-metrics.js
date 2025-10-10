/**
 * Generate public metrics JSON from Firestore
 * This script is run by GitHub Actions to create a static JSON file
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, getDocs, where } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generatePublicMetrics() {
  try {
    console.log('Fetching metrics from public_metrics collection...');

    // Fetch the latest public_metrics snapshot
    const metricsQuery = query(
      collection(db, 'public_metrics'),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(metricsQuery);

    if (snapshot.empty) {
      console.error('No public metrics found in Firestore');
      console.log('Make sure to log in to the metrics page at least once to generate initial data');
      process.exit(1);
    }

    const metricsData = snapshot.docs[0].data();

    // Write to JSON file
    const outputPath = path.join(__dirname, '../data/public-metrics.json');
    fs.writeFileSync(outputPath, JSON.stringify(metricsData, null, 2));

    console.log(`✅ Successfully generated public-metrics.json`);
    console.log(`   Current week: ${metricsData.currentWeek?.weekStart} to ${metricsData.currentWeek?.weekEnd}`);
    console.log(`   Total weeks: ${metricsData.allWeeks?.length || 0}`);
    console.log(`   Updated: ${metricsData.updatedAt}`);

  } catch (error) {
    console.error('Error generating public metrics:', error);
    process.exit(1);
  }
}

generatePublicMetrics();
