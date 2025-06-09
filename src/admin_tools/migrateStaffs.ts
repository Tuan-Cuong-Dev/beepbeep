// src/admin_tools/migrateStaffs.ts
import { adminDb } from './firebaseAdmin';

async function migrateStaffs() {
  const staffSnap = await adminDb.collection('staffs').get();

  for (const docSnap of staffSnap.docs) {
    const data = docSnap.data();
    const oldId = docSnap.id;
    const userId = data.userId;

    if (!userId) {
      console.warn(`⚠️ Skip ${oldId}: no userId`);
      continue;
    }

    if (oldId === userId) {
      console.log(`✅ Already correct: ${userId}`);
      continue;
    }

    try {
      await adminDb.collection('staffs').doc(userId).set(data);
      await adminDb.collection('staffs').doc(oldId).delete();
      console.log(`🔁 Migrated: ${oldId} → ${userId}`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${oldId}:`, err);
    }
  }

  console.log('✅ Migration completed.');
}

migrateStaffs();
