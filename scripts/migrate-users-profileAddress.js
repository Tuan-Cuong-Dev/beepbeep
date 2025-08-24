// scripts/migrate-users-profileAddress.js
require('dotenv').config();
const admin = require('firebase-admin');

/**
 * Init credentials:
 *  - FIREBASE_ADMIN_CREDENTIALS_B64 (base64 of JSON)
 *  - FIREBASE_ADMIN_CREDENTIALS (raw JSON)
 *  - fallback ADC (GOOGLE_APPLICATION_CREDENTIALS)
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
    admin.initializeApp();
    console.log('[init] Using Application Default Credentials (ADC)');
  } catch (e) {
    console.error('[init] Error:', e);
    process.exit(1);
  }
})();

const db = admin.firestore();

const MODE = (process.env.MODE || 'check').toLowerCase();   // check | migrate | cleanup
const BATCH = Number(process.env.BATCH || 400);
// Nếu muốn cho phép ghi đè profileAddress hiện có:
const OVERWRITE_PROFILE_ADDRESS = process.env.OVERWRITE_PROFILE_ADDRESS === '1';

/**
 * Build AddressCore from legacy flat fields
 * AddressCore:
 *   line1, line2, locality (city), adminArea (state), postalCode (zip), countryCode, formatted
 */
function buildAddressCoreFromLegacy(d) {
  const line1 = (d.address || '').trim() || undefined;
  const line2 = (d.address2 || '').trim() || undefined;
  const locality = (d.city || '').trim() || undefined;
  const adminArea = (d.state || '').trim() || undefined;
  const postalCode = (d.zip || '').trim() || undefined;
  let countryCode = (d.country || '').trim() || undefined;

  // Chuẩn hoá countryCode: ưu tiên 2 chữ cái in hoa nếu người dùng đã nhập như vậy
  if (countryCode && countryCode.length <= 3) {
    countryCode = countryCode.toUpperCase();
  }

  // formatted (tuỳ chọn): ghép các mảnh có giá trị
  const parts = [line1, line2, locality, adminArea, postalCode, countryCode].filter(Boolean);
  const formatted = parts.length ? parts.join(', ') : undefined;

  // Nếu không có mảnh nào thì trả null để caller bỏ qua
  if (!line1 && !line2 && !locality && !adminArea && !postalCode && !countryCode) {
    return null;
  }

  return {
    line1,
    line2,
    locality,
    adminArea,
    postalCode,
    countryCode,
    formatted,
  };
}

async function checkUsers() {
  let scanned = 0, hasLegacyAny = 0, hasProfileAddr = 0, both = 0, empty = 0;

  await iterateUsers(async (doc, d) => {
    scanned++;
    const legacy =
      !!(d.address || d.address2 || d.city || d.state || d.zip || d.country);
    const hasProfile = !!d.profileAddress;

    if (legacy) hasLegacyAny++;
    if (hasProfile) hasProfileAddr++;
    if (legacy && hasProfile) both++;
    if (!legacy && !hasProfile) empty++;
  });

  console.log('Users CHECK >> scanned:', scanned);
  console.log(' - legacy address fields:', hasLegacyAny);
  console.log(' - profileAddress exists:', hasProfileAddr);
  console.log(' - both legacy & profileAddress:', both);
  console.log(' - neither (empty):', empty);
}

async function migrateUsers() {
  let scanned = 0, updated = 0, skippedNoLegacy = 0, skippedHasProfile = 0;

  await iterateUsers(async (doc, d, state) => {
    scanned++;

    const legacyExists =
      !!(d.address || d.address2 || d.city || d.state || d.zip || d.country);

    if (!legacyExists) {
      skippedNoLegacy++;
      return;
    }

    const addr = buildAddressCoreFromLegacy(d);
    if (!addr) {
      skippedNoLegacy++;
      return;
    }

    const hasProfile = !!d.profileAddress;

    if (hasProfile && !OVERWRITE_PROFILE_ADDRESS) {
      skippedHasProfile++;
      return;
    }

    // Nếu đã có profileAddress & cho phép overwrite -> merge giữ formatted cũ nếu muốn
    const payload = {
      profileAddress: hasProfile ? { ...d.profileAddress, ...addr } : addr,
      _migrated_profile_address: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    state.batch.update(doc.ref, payload);
    state.batchUpdates++;
    updated++;
  });

  console.log('Users MIGRATE >> scanned:', scanned, '| migrated:', updated, '| skipped(no legacy):', skippedNoLegacy, '| skipped(has profile, no overwrite):', skippedHasProfile);
}

async function cleanupUsers() {
  let scanned = 0, cleaned = 0;

  await iterateUsers(async (doc, d, state) => {
    scanned++;

    const legacyExists =
      !!(d.address || d.address2 || d.city || d.state || d.zip || d.country);

    if (!legacyExists) return;

    // Chỉ xoá khi đã có profileAddress (an toàn)
    if (!d.profileAddress) return;

    state.batch.update(doc.ref, {
      address: admin.firestore.FieldValue.delete(),
      address2: admin.firestore.FieldValue.delete(),
      city: admin.firestore.FieldValue.delete(),
      state: admin.firestore.FieldValue.delete(),
      zip: admin.firestore.FieldValue.delete(),
      country: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    state.batchUpdates++;
    cleaned++;
  });

  console.log('Users CLEANUP >> scanned:', scanned, '| cleaned legacy fields:', cleaned);
}

/**
 * Iterate users with pagination and batched writes
 * @param {(doc, data, state:{batch,batchUpdates}) => Promise<void>} handler
 */
async function iterateUsers(handler) {
  const col = db.collection('users');
  let last = null;
  let totalScanned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH);
    if (last) q = q.startAfter(last.id);

    const snap = await q.get();
    if (snap.empty) break;

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

    last = snap.docs[snap.docs.length - 1];
    console.log(`[users] page scanned=${totalScanned} | thisPageWrites=${batchUpdates}`);
  }
}

// Runner
(async () => {
  console.log(`MODE=${MODE} | BATCH=${BATCH} | OVERWRITE_PROFILE_ADDRESS=${OVERWRITE_PROFILE_ADDRESS ? '1' : '0'}`);
  if (MODE === 'check') await checkUsers();
  if (MODE === 'migrate') { await migrateUsers(); await checkUsers(); }
  if (MODE === 'cleanup') { await cleanupUsers(); await checkUsers(); }
  console.log('DONE');
  process.exit(0);
})();
