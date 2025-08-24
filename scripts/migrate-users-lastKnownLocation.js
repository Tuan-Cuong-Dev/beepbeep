// scripts/migrate-users-lastKnownLocation.js
require('dotenv').config();
const admin = require('firebase-admin');

/**
 * Init credentials: ưu tiên FIREBASE_ADMIN_CREDENTIALS_B64 → FIREBASE_ADMIN_CREDENTIALS → ADC
 */
(function init() {
  try {
    const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
    const json = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (b64) {
      const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      console.log('[init] Using FIREBASE_ADMIN_CREDENTIALS_B64 project:', sa.project_id);
      return;
    }
    if (json) {
      const sa = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      console.log('[init] Using FIREBASE_ADMIN_CREDENTIALS project:', sa.project_id);
      return;
    }
    admin.initializeApp(); // ADC fallback (chỉ khi bạn đã cấu hình GOOGLE_APPLICATION_CREDENTIALS)
    console.log('[init] Using Application Default Credentials (ADC)');
  } catch (e) {
    console.error('[init] Error:', e);
    process.exit(1);
  }
})();

const db = admin.firestore();

const MODE = (process.env.MODE || 'check').toLowerCase(); // check | migrate | cleanup
const BATCH = Number(process.env.BATCH || 400);

/**
 * Helper: build LocationCore từ legacy lastKnownLocation
 * - Ưu tiên l.geo (GeoPoint) nếu đã có (đúng chuẩn)
 * - Fallback từ lat/lng số → GeoPoint
 * - Điền location = "lat,lng", giữ address cũ (nếu có), updatedAt=serverTimestamp()
 */
function toLocationCore(l, fallbackUpdatedAt) {
  if (!l) return null;

  // Đã đúng chuẩn (có GeoPoint)
  if (l.geo instanceof admin.firestore.GeoPoint) {
    const lat = l.geo.latitude;
    const lng = l.geo.longitude;
    const locationStr =
      typeof l.location === 'string' && l.location.trim()
        ? l.location
        : `${lat},${lng}`;
    return {
      geo: l.geo,
      location: locationStr,
      address: l.address ?? undefined,
      mapAddress: l.mapAddress ?? undefined,
      updatedAt: l.updatedAt ?? fallbackUpdatedAt ?? admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  // Legacy lat/lng dạng số
  const lat =
    typeof l.lat === 'number' ? l.lat :
    typeof l?.geo?.lat === 'number' ? l.geo.lat : undefined;
  const lng =
    typeof l.lng === 'number' ? l.lng :
    typeof l?.geo?.lng === 'number' ? l.geo.lng : undefined;

  if (typeof lat === 'number' && typeof lng === 'number') {
    const gp = new admin.firestore.GeoPoint(lat, lng);
    return {
      geo: gp,
      location: `${lat},${lng}`,
      address: l.address ?? undefined,
      mapAddress: l.mapAddress ?? undefined,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  return null;
}

async function checkUsers() {
  let scanned = 0, okGeo = 0, legacyLatLng = 0, empty = 0, missingLocationStr = 0;
  await iterateUsers(async (doc, d) => {
    scanned++;
    const l = d?.lastKnownLocation;
    if (!l) { empty++; return; }

    if (l.geo instanceof admin.firestore.GeoPoint) {
      okGeo++;
      if (!l.location || typeof l.location !== 'string' || !l.location.trim()) {
        missingLocationStr++;
      }
      return;
    }

    if (typeof l.lat === 'number' && typeof l.lng === 'number') {
      legacyLatLng++;
      return;
    }

    // else: empty++ (không có gì dùng được)
    empty++;
  });
  console.log('Users check >> scanned:', scanned, '| okGeo:', okGeo, '| legacy lat/lng:', legacyLatLng, '| empty:', empty, '| okGeo but missing locationString:', missingLocationStr);
}

async function migrateUsers() {
  let scanned = 0, updated = 0, fixedLocationStr = 0, skipped = 0;

  await iterateUsers(async (doc, d, batchState) => {
    scanned++;
    const l = d?.lastKnownLocation;

    if (!l) { skipped++; return; }

    // Trường hợp đã có GeoPoint nhưng thiếu location string -> chỉ fix location + updatedAt
    if (l.geo instanceof admin.firestore.GeoPoint) {
      const needsLocationStr = !l.location || typeof l.location !== 'string' || !l.location.trim();
      if (needsLocationStr) {
        batchState.batch.update(doc.ref, {
          'lastKnownLocation.location': `${l.geo.latitude},${l.geo.longitude}`,
          'lastKnownLocation.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
          _migrated_user_loc: true,
        });
        batchState.batchUpdates++;
        fixedLocationStr++;
      }
      return;
    }

    // Legacy lat/lng -> build LocationCore
    if (typeof l.lat === 'number' && typeof l.lng === 'number') {
      const lc = toLocationCore(l, d?.updatedAt);
      if (lc) {
        batchState.batch.update(doc.ref, {
          lastKnownLocation: lc,
          _migrated_user_loc: true,
        });
        batchState.batchUpdates++;
        updated++;
      }
      return;
    }

    // Không migrate được
    skipped++;
  });

  console.log('Users migrate >> scanned:', scanned, '| migrated:', updated, '| fixedLocationStr:', fixedLocationStr, '| skipped:', skipped);
}

async function cleanupUsers() {
  let scanned = 0, cleaned = 0, skipped = 0;

  await iterateUsers(async (doc, d, batchState) => {
    scanned++;
    const l = d?.lastKnownLocation;
    if (!l) { skipped++; return; }

    if (l.geo instanceof admin.firestore.GeoPoint) {
      // Xoá legacy lat/lng nếu còn
      const asAny = l;
      const needDelete =
        Object.prototype.hasOwnProperty.call(asAny, 'lat') ||
        Object.prototype.hasOwnProperty.call(asAny, 'lng');

      if (needDelete) {
        batchState.batch.update(doc.ref, {
          'lastKnownLocation.lat': admin.firestore.FieldValue.delete(),
          'lastKnownLocation.lng': admin.firestore.FieldValue.delete(),
        });
        batchState.batchUpdates++;
        cleaned++;
      }
      return;
    }
    skipped++;
  });

  console.log('Users cleanup >> scanned:', scanned, '| cleaned legacy lat/lng:', cleaned, '| skipped:', skipped);
}

/**
 * Iterate users collection with pagination and batched writes
 * @param {(doc, data, {batch,batchUpdates,commit}) => Promise<void>} handler
 */
async function iterateUsers(handler) {
  const col = db.collection('users');
  let lastDoc = null;
  let totalScanned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (lastDoc) q = q.startAfter(lastDoc.id);

    const snap = await q.get();
    if (snap.empty) break;

    // new batch for this page
    let batch = db.batch();
    let batchUpdates = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      await handler(doc, d, {
        batch,
        get batchUpdates() { return batchUpdates; },
        set batchUpdates(n) { batchUpdates = n; },
      });

      totalScanned++;
    }

    if (batchUpdates > 0) {
      await batch.commit();
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    console.log(`[users] page scanned=${totalScanned} | thisPageWrites=${batchUpdates}`);
  }
}

// ---- Runner ----
(async () => {
  console.log(`MODE=${MODE} | BATCH=${BATCH}`);
  if (MODE === 'check') await checkUsers();
  if (MODE === 'migrate') { await migrateUsers(); await checkUsers(); }
  if (MODE === 'cleanup') { await cleanupUsers(); await checkUsers(); }
  console.log('DONE.');
  process.exit(0);
})();
