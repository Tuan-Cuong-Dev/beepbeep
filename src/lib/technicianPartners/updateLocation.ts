// lib/technicianPartners/updateLocation.ts
import {
  doc,
  getDocs,
  query,
  where,
  collection,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

type Coords = { lat: number; lng: number };

type UpdateOpts = {
  technicianPartnerId?: string | null; // nếu biết sẵn doc id → nhanh nhất
  userId?: string | null;              // fallback tra theo userId
  coords: Coords;                      // toạ độ bắt buộc
  accuracy?: number | null;
  source?: 'web' | 'app';
  debug?: boolean;                     // ✅ bật debug log
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Cập nhật vị trí trực tiếp vào document technicianPartners
 * - Ưu tiên truyền technicianPartnerId để set nhanh
 * - Nếu chưa có, truyền userId để tìm doc đầu tiên (theo userId)
 * - Trả về { ok, id } để bạn có thể kiểm tra ở caller
 */
export async function updateTechnicianPartnerLocation(opts: UpdateOpts): Promise<{
  ok: boolean;
  id: string | null;
  reason?: string;
}> {
  const {
    technicianPartnerId,
    userId,
    coords,
    accuracy = null,
    source = 'web',
    debug = false,
  } = opts;

  const t0 = (typeof performance !== 'undefined' && performance.now()) || Date.now();
  const log  = (...args: any[]) => debug && console.debug('[TP-UpdateLocation]', ...args);
  const warn = (...args: any[]) => debug && console.warn('[TP-UpdateLocation]', ...args);
  const err  = (...args: any[]) => debug && console.error('[TP-UpdateLocation]', ...args);

  // 1) Validate input
  if (!coords || !isFiniteNumber(coords.lat) || !isFiniteNumber(coords.lng)) {
    warn('Invalid coords → skip', coords);
    return { ok: false, id: null, reason: 'invalid_coords' };
  }

  let targetId = technicianPartnerId ?? null;

  // 2) Resolve targetId nếu chưa có
  if (!targetId) {
    if (!userId) {
      warn('Missing both technicianPartnerId and userId → cannot resolve target doc');
      return { ok: false, id: null, reason: 'missing_ids' };
    }

    try {
      log('Resolving doc by userId:', userId);
      const snap = await getDocs(
        query(collection(db, 'technicianPartners'), where('userId', '==', userId))
      );

      if (snap.empty) {
        warn('No technicianPartners doc found for userId:', userId);
        return { ok: false, id: null, reason: 'doc_not_found' };
      }

      targetId = snap.docs[0].id;
      log('Resolved technicianPartnerId:', targetId);
    } catch (e) {
      err('Failed to resolve doc by userId:', e);
      return { ok: false, id: null, reason: 'resolve_error' };
    }
  }

  // 3) Ghi cập nhật
  try {
    const ref = doc(db, 'technicianPartners', targetId);
    log('Updating location →', {
      id: targetId,
      lat: coords.lat,
      lng: coords.lng,
      accuracy,
      source,
    });

    await setDoc(
      ref,
      {
        // Các field hiện có trong schema
        coordinates: { lat: coords.lat, lng: coords.lng },
        geo: { lat: coords.lat, lng: coords.lng },

        // Thêm vài trường tiện theo dõi/hiển thị
        lastSeenAt: serverTimestamp(),
        lastSeenSource: source,
        locationAccuracy: accuracy,

        // Nếu muốn “kích hoạt” hiển thị điểm đang online
        isActive: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const t1 = (typeof performance !== 'undefined' && performance.now()) || Date.now();
    log(`Update OK in ${(t1 - t0).toFixed(1)}ms`);
    return { ok: true, id: targetId };
  } catch (e) {
    err('Failed to setDoc:', e);
    return { ok: false, id: targetId, reason: 'write_error' };
  }
}
