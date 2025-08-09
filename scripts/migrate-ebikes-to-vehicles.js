// scripts/migrate-ebikes-to-vehicles.js
// Phương pháp chạy nope trực tiếp để chuyển data 
// Chạy lệnh này trên đường dẫn cùng với npm run dev restart lại server
// node scripts/migrate-ebikes-to-vehicles.js

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json'); // <- file JSON bạn tải từ Firebase

const PAGE_SIZE = 400; // <500 vì batch Firestore tối đa 500

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  // ✅ Khởi tạo bằng serviceAccount JSON (KHÔNG dùng applicationDefault)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = admin.firestore();

  let lastId = null;
  let total = 0;
  let batches = 0;

  console.log(`Starting migrate (dryRun=${dryRun}) ...`);
  const t0 = Date.now();

  while (true) {
    let q = db.collection('ebikes').orderBy('__name__').limit(PAGE_SIZE);
    if (lastId) q = q.startAfter(lastId);

    const snap = await q.get();
    if (snap.empty) break;

    if (!dryRun) {
      const batch = db.batch();
      for (const d of snap.docs) {
        const toRef = db.collection('vehicles').doc(d.id); // giữ nguyên id
        batch.set(
          toRef,
          { ...d.data(), migratedFrom: 'ebikes', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
      await batch.commit();
      batches++;
    }

    total += snap.docs.length;
    lastId = snap.docs[snap.docs.length - 1].id;
    console.log(`  processed ${total} docs...`);
  }

  console.log(`Done. dryRun=${dryRun} total=${total} batches=${batches} took=${Date.now() - t0}ms`);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
