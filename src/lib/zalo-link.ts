// src/lib/zalo-link.ts
import { db } from "@/src/lib/firebase-client";
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where, Timestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const REGION = "asia-southeast1";
const functions = getFunctions(undefined, REGION);

type LinkStatus = {
  linked: boolean;
  zaloUserId?: string | null;
  code?: string | null;
  expiresAtMs?: number;
};

export async function getLinkStatus(uid: string): Promise<LinkStatus> {
  if (!uid) throw new Error("Missing uid");

  // 1) đã map?
  const pref = await getDoc(doc(db, "userNotificationPreferences", uid));
  const zaloUserId = pref.exists() ? (pref.data()?.contact?.zaloUserId ?? null) : null;
  if (zaloUserId) return { linked: true, zaloUserId };

  // 2) chưa map → lấy mã còn hạn gần nhất
  const snap = await getDocs(query(
    collection(db, "zalo_link_codes"),
    where("uid", "==", uid),
    where("used", "==", false),
    orderBy("expiresAtMs", "desc"),
    limit(1)
  ));

  if (snap.empty) return { linked: false, code: null, expiresAtMs: undefined };

  const d = snap.docs[0].data() as {
    code?: string;
    expiresAt?: number | Timestamp;
    expiresAtMs?: number | Timestamp;
  };

  const expiresAtMs =
    d.expiresAtMs instanceof Timestamp ? d.expiresAtMs.toMillis()
    : d.expiresAt      instanceof Timestamp ? d.expiresAt.toMillis()
    : typeof d.expiresAtMs === "number"      ? d.expiresAtMs
    : typeof d.expiresAt === "number"        ? d.expiresAt
    : undefined;

  const code = d.code ?? snap.docs[0].id;
  return { linked: false, code, expiresAtMs };
}

export async function ensureLinkCode(
  uid: string,
  ttlMinutes = 10,
  length = 6
): Promise<{ code: string; expiresAtMs: number }> {
  if (!uid) throw new Error("Missing uid");
  const callable = httpsCallable(functions, "createZaloLinkCode");
  const res = await callable({ ttlMinutes, length });
  const data = (res.data as any) ?? {};

  const code: string | undefined = data.code ?? data.id;
  if (!code) throw new Error(data.error ?? "Không nhận được code");

  const expiresAtMs =
    data.expiresAtMs?.toMillis?.() ?? // in case server returns Timestamp
    (typeof data.expiresAtMs === "number" ? data.expiresAtMs
     : typeof data.expiresAt === "number" ? data.expiresAt
     : undefined);

  if (!expiresAtMs) throw new Error("Thiếu expiresAt từ server");
  return { code, expiresAtMs };
}
