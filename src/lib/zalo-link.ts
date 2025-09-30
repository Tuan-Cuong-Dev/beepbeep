// src/lib/zalo-link.ts
import { db } from '@/src/lib/firebase-client';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where, Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const REGION = 'asia-southeast1';
const functions = getFunctions(undefined, REGION);

type LinkStatus = {
  linked: boolean;
  zaloUserId?: string | null;
  code?: string | null;
  expiresAtMs?: number;
};

/** Lấy trạng thái liên kết OA ↔ user */
export async function getLinkStatus(uid: string): Promise<LinkStatus> {
  if (!uid) throw new Error('Missing uid');

  // 1) Nếu user đã map zaloUserId thì coi như linked
  const prefSnap = await getDoc(doc(db, 'userNotificationPreferences', uid));
  const zaloUserId = prefSnap.exists()
    ? (prefSnap.data()?.contact?.zaloUserId ?? null)
    : null;
  if (zaloUserId) return { linked: true, zaloUserId };

  // 2) Chưa map → tìm mã còn hạn (mới nhất)
  // Cần composite index: (uid ASC, used ASC, expiresAt DESC)
  const q = query(
    collection(db, 'zalo_link_codes'),
    where('uid', '==', uid),
    where('used', '==', false),
    orderBy('expiresAt', 'desc'), // nếu DB của bạn dùng expiresAtMs, xem fallback bên dưới
    limit(1)
  );

  let snap;
  try {
    snap = await getDocs(q);
  } catch (e) {
    // Fallback nếu project cũ đang để field là expiresAtMs thay vì expiresAt
    const q2 = query(
      collection(db, 'zalo_link_codes'),
      where('uid', '==', uid),
      where('used', '==', false),
      orderBy('expiresAtMs', 'desc'),
      limit(1)
    );
    snap = await getDocs(q2);
  }

  if (snap.empty) return { linked: false, code: null, expiresAtMs: undefined };

  const docSnap = snap.docs[0];
  const d = docSnap.data() as {
    code?: string;
    expiresAt?: number | Timestamp;
    expiresAtMs?: number | Timestamp;
  };

  // Chuẩn hoá expiresAtMs (hỗ trợ cả number lẫn Timestamp và cả 2 tên trường)
  const expiresAtMs =
    d.expiresAt instanceof Timestamp
      ? d.expiresAt.toMillis()
      : d.expiresAtMs instanceof Timestamp
      ? d.expiresAtMs.toMillis()
      : typeof d.expiresAt === 'number'
      ? d.expiresAt
      : typeof d.expiresAtMs === 'number'
      ? d.expiresAtMs
      : undefined;

  // code: ưu tiên field 'code', fallback docId nếu dùng docId làm mã
  const code = d.code ?? docSnap.id;

  return { linked: false, code, expiresAtMs };
}

/** Tạo/cấp lại mã liên kết. Server có thể tái dùng mã còn hạn */
export async function ensureLinkCode(
  uid: string,
  ttlMinutes = 10,
  length = 6
): Promise<{ code: string; expiresAtMs: number }> {
  if (!uid) throw new Error('Missing uid');

  const callable = httpsCallable(functions, 'createZaloLinkCode');
  const res = await callable({ length, ttlMinutes }); // uid lấy từ context.auth ở server

  const data = (res.data as any) ?? {};
  const code: string | undefined = data.code ?? data.id;
  if (!code) throw new Error(data.error ?? 'Không nhận được code');

  // Chuẩn hoá expiresAtMs từ payload server
  const expiresAtMs =
    data.expiresAt instanceof Timestamp
      ? data.expiresAt.toMillis()
      : data.expiresAtMs instanceof Timestamp
      ? data.expiresAtMs.toMillis()
      : typeof data.expiresAt === 'number'
      ? data.expiresAt
      : typeof data.expiresAtMs === 'number'
      ? data.expiresAtMs
      : undefined;

  if (!expiresAtMs) throw new Error('Thiếu expiresAt từ server');

  return { code, expiresAtMs };
}
