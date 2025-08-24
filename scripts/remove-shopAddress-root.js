// scripts/remove-shopAddress-root.js
require('dotenv').config();
const admin = require('firebase-admin');

// --- Init cred ---
(function init() {
  try {
    const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
    const json = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (b64) {
      const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      console.log('[init] FIREBASE_ADMIN_CREDENTIALS_B64 project:', sa.project_id);
      return;
    }
    if (json) {
      const sa = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      console.log('[init] FIREBASE_ADMIN_CREDENTIALS project:', sa.project_id);
      return;
    }
    admin.initializeApp();
    console.log('[init] ADC fallback');
  } catch (e) {
    console.error('Init error:', e);
    process.exit(1);
  }
})();

const db = admin.firestore();
const BATCH = Number(process.env.BATCH || 400);

(async () => {
  let last = null;
  let scanned = 0, removed = 0;

  while (true) {
    let q = db.collection('technicianPartners')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH);
    if (last) q = q.startAfter(last.id);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();

    snap.docs.forEach(doc => {
      const d = doc.data();
      scanned++;

      if (d.hasOwnProperty('shopAddress')) {
        batch.update(doc.ref, {
          shopAddress: admin.firestore.FieldValue.delete()
        });
        removed++;
      }
    });

    if (removed > 0) {
      await batch.commit();
    }

    last = snap.docs[snap.docs.length - 1];
    console.log(`Scanned=${scanned}, removed=${removed} so far...`);
  }

  console.log('DONE. Total removed shopAddress:', removed);
  process.exit(0);
})();
