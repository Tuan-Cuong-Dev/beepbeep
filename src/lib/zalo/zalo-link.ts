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

export async function getLinkStatus(uid: string) {
  const r = await fetch(`/api/zalo/status?uid=${encodeURIComponent(uid)}`, {
    cache: "no-store",         // <- tắt cache browser/Next
  });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || "STATUS_FAILED");
  return d as { ok: true; linked: boolean; zaloUserId?: string; code?: string; expiresAtMs?: number };
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

//  Unlink
export async function unlinkZalo(uid: string): Promise<void> {
  const secret = process.env.NEXT_PUBLIC_INTERNAL_WORKER_SECRET || "";
  const res = await fetch("/api/zalo/unlink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ uid }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "UNLINK_FAILED");
  }
}

