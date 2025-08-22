// scripts/migrate-location-env.js
// ✅ Dùng trực tiếp file secret/serviceAccount.json (không dùng ENV JSON / ADC)

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// --- Init credential trực tiếp từ file ---
function initAdminFromFile() {
  try {
    // scripts/ -> ../secret/serviceAccount.json ở project root
    const filePath = path.resolve(__dirname, '../secret/serviceAccount.json');
    if (!fs.existsSync(filePath)) {
      console.error('[init] Missing credentials file at:', filePath);
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const sa = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    console.log('[init] Using secret/serviceAccount.json for project:', sa.project_id);
  } catch (e) {
    console.error('[init] Cannot load/parse secret/serviceAccount.json:', e.message);
    process.exit(1);
  }
}
initAdminFromFile();

const db = admin.firestore();

// --- Config ---
const BATCH = Number.parseInt(process.env.BATCH || '300', 10);
const TP_MODE = (process.env.MODE || 'check').toLowerCase();          // check | migrate | cleanup
const USERS_MODE = (process.env.USERS_MODE || 'skip').toLowerCase();  // skip | check | migrate | cleanup

// --- Helpers ---
function isGeoPoint(v) {
  return v instanceof admin.firestore.GeoPoint;
}

async function iterateCollection(colName, handler) {
  const col = db.collection(colName);
  let last = undefined;
  let scanned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      await handler(doc);
      scanned++;
    }
    last = snap.docs[snap.docs.length - 1];
    console.log(`[${colName}] scanned: ${scanned}`);
  }
}

// ===== Technician Partners =====
async function checkTP() {
  let withGeo = 0, withCoords = 0, none = 0;
  await iterateCollection('technicianPartners', (doc) => {
    const d = doc.data();
    const hasGeo = isGeoPoint(d?.location?.geo);
    const hasCoords = !!d?.coordinates;
    if (hasGeo) withGeo++;
    else if (hasCoords) withCoords++;
    else none++;
  });
  console.log('TP >> withGeo:', withGeo, '| withCoordsOnly:', withCoords, '| none:', none);
}

async function migrateTP() {
  const col = db.collection('technicianPartners');
  let last = undefined, totalUpdated = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let updatedInBatch = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const hasGeo = isGeoPoint(d?.location?.geo);
      const c = d?.coordinates;

      // Backfill khi chưa có geo & có coordinates hợp lệ
      if (!hasGeo && c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
        const gp = new admin.firestore.GeoPoint(c.lat, c.lng);
        const mapAddress = d?.location?.mapAddress ?? d?.mapAddress ?? undefined;
        batch.update(doc.ref, {
          location: {
            geo: gp,
            ...(mapAddress ? { mapAddress } : {}),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          _migrated_location: true,
        });
        updatedInBatch++;
      }
    }

    if (updatedInBatch > 0) {
      await batch.commit();
      totalUpdated += updatedInBatch;
      console.log(`TP migrate committed this batch: ${updatedInBatch} | total: ${totalUpdated}`);
    } else {
      console.log('TP migrate no-op for this batch');
    }

    last = snap.docs[snap.docs.length - 1];
  }
  console.log('TP migrate done. updated total:', totalUpdated);
}

async function cleanupTP() {
  const col = db.collection('technicianPartners');
  let last = undefined, totalCleaned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let cleanedInBatch = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const hasGeo = isGeoPoint(d?.location?.geo);
      if (hasGeo && d?.coordinates) {
        batch.update(doc.ref, { coordinates: admin.firestore.FieldValue.delete() });
        cleanedInBatch++;
      }
    }

    if (cleanedInBatch > 0) {
      await batch.commit();
      totalCleaned += cleanedInBatch;
      console.log(`TP cleanup committed this batch: ${cleanedInBatch} | total: ${totalCleaned}`);
    } else {
      console.log('TP cleanup no-op for this batch');
    }

    last = snap.docs[snap.docs.length - 1];
  }
  console.log('TP cleanup done. cleaned total:', totalCleaned);
}

// ===== Users (optional) =====
async function checkUsers() {
  let withGeo = 0, legacy = 0, none = 0;
  await iterateCollection('users', (doc) => {
    const l = doc.data()?.lastKnownLocation;
    if (!l) { none++; return; }
    const hasGeo = isGeoPoint(l?.geo);
    if (hasGeo) withGeo++;
    else if (typeof l?.lat === 'number' && typeof l?.lng === 'number') legacy++;
    else none++;
  });
  console.log('Users >> withGeo:', withGeo, '| legacy lat/lng:', legacy, '| none:', none);
}

async function migrateUsers() {
  const col = db.collection('users');
  let last = undefined, totalUpdated = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let updatedInBatch = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const l = d?.lastKnownLocation;
      if (!l) continue;
      const hasGeo = isGeoPoint(l?.geo);

      if (!hasGeo && typeof l?.lat === 'number' && typeof l?.lng === 'number') {
        const gp = new admin.firestore.GeoPoint(l.lat, l.lng);
        batch.update(doc.ref, {
          lastKnownLocation: {
            geo: gp,
            location: `${gp.latitude},${gp.longitude}`,
            address: l.address ?? '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          _migrated_user_loc: true,
        });
        updatedInBatch++;
      } else if (hasGeo && !l?.location) {
        batch.update(doc.ref, {
          'lastKnownLocation.location': `${l.geo.latitude},${l.geo.longitude}`,
          _migrated_user_loc: true,
        });
        updatedInBatch++;
      }
    }

    if (updatedInBatch > 0) {
      await batch.commit();
      totalUpdated += updatedInBatch;
      console.log(`Users migrate committed this batch: ${updatedInBatch} | total: ${totalUpdated}`);
    } else {
      console.log('Users migrate no-op for this batch');
    }

    last = snap.docs[snap.docs.length - 1];
  }
  console.log('Users migrate done. updated total:', totalUpdated);
}

async function cleanupUsers() {
  const col = db.collection('users');
  let last = undefined, totalCleaned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let cleanedInBatch = 0;

    for (const doc of snap.docs) {
      const l = doc.data()?.lastKnownLocation;
      if (isGeoPoint(l?.geo) && (l?.lat != null || l?.lng != null)) {
        batch.update(doc.ref, {
          'lastKnownLocation.lat': admin.firestore.FieldValue.delete(),
          'lastKnownLocation.lng': admin.firestore.FieldValue.delete(),
        });
        cleanedInBatch++;
      }
    }

    if (cleanedInBatch > 0) {
      await batch.commit();
      totalCleaned += cleanedInBatch;
      console.log(`Users cleanup committed this batch: ${cleanedInBatch} | total: ${totalCleaned}`);
    } else {
      console.log('Users cleanup no-op for this batch');
    }

    last = snap.docs[snap.docs.length - 1];
  }
  console.log('Users cleanup done. cleaned total:', totalCleaned);
}

// --- Runner ---
process.on('SIGINT', () => {
  console.log('\n[signal] Caught SIGINT. Exiting...');
  process.exit(1);
});

(async () => {
  console.log('TP MODE =', TP_MODE, '| USERS_MODE =', USERS_MODE, '| BATCH =', BATCH);

  if (TP_MODE === 'check') await checkTP();
  if (TP_MODE === 'migrate') { await migrateTP(); await checkTP(); }
  if (TP_MODE === 'cleanup') { await cleanupTP(); await checkTP(); }

  if (USERS_MODE === 'check') await checkUsers();
  if (USERS_MODE === 'migrate') { await migrateUsers(); await checkUsers(); }
  if (USERS_MODE === 'cleanup') { await cleanupUsers(); await checkUsers(); }

  console.log('DONE.');
  process.exit(0);
})();
