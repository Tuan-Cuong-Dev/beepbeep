// src/app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, FieldValue } from "@/src/lib/firebaseAdmin";

export const runtime = "nodejs";           // cần Node để dùng crypto
export const dynamic = "force-dynamic";    // tránh cache trên edge

const APP_SECRET = process.env.ZALO_APP_SECRET || "";
const SKIP_SIG = process.env.ZALO_SKIP_SIGNATURE === "1"; // chỉ dùng khi test
const DEBUG = process.env.ZALO_DEBUG === "1";

function log(...args: any[]) {
  if (DEBUG) console.log("[ZALO]", ...args);
}

function verifySignature(raw: string, headerSig?: string | null): boolean {
  if (SKIP_SIG) return true;
  if (!headerSig || !APP_SECRET) return false;
  // OA có nơi dùng base64, có nơi dùng hex → hỗ trợ cả 2
  const hex = crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex");
  const b64 = crypto.createHmac("sha256", APP_SECRET).update(raw).digest("base64");
  return headerSig === hex || headerSig === b64;
}

// Bắt nhiều biến thể payload OA (v3/v4, events[])
function extractZaloUserId(body: any): string | null {
  if (body?.sender?.id) return String(body.sender.id);
  if (body?.from?.id) return String(body.from.id);
  if (body?.user_id) return String(body.user_id);
  if (body?.message?.user_id) return String(body.message.user_id);
  if (body?.follower?.id) return String(body.follower.id);
  if (Array.isArray(body?.events)) {
    for (const e of body.events) {
      if (e?.sender?.id) return String(e.sender.id);
      if (e?.user_id) return String(e.user_id);
    }
  }
  return null;
}

function extractText(body: any): string {
  if (body?.message?.text) return String(body.message.text);
  if (body?.message?.content) return String(body.message.content);
  if (body?.text) return String(body.text);
  if (body?.event?.message?.text) return String(body.event.message.text);
  if (Array.isArray(body?.events)) {
    for (const e of body.events) {
      if (e?.message?.text) return String(e.message.text);
      if (typeof e?.payload === "string") return e.payload; // postback
    }
  }
  return "";
}

function extractLinkCode(text: string): string | null {
  // hỗ trợ: "link-ABC123", "Link ABC123", "LINK_ABC123", "link: ABC123"
  const m = /link[\s:_-]*([A-Za-z0-9]{4,32})/i.exec(text || "");
  return m?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  // Lấy raw body để verify chữ ký
  const raw = await req.text();
  const sig = req.headers.get("x-zalo-signature") || req.headers.get("X-Zalo-Signature");

  if (!verifySignature(raw, sig)) {
    log("signature mismatch", { sig });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const zaloUserId = extractZaloUserId(body);
  const text = extractText(body);
  const code = extractLinkCode(text);

  log("payload", { zaloUserId, text, code });

  // Không đủ dữ liệu → vẫn trả 200 để OA không retry
  if (!zaloUserId || !code) {
    return NextResponse.json({ ok: true, linked: false, reason: "MISSING_USER_OR_CODE" });
  }

  const codeRef = db.collection("zalo_link_codes").doc(code);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(codeRef);
      if (!snap.exists) throw new Error("INVALID_CODE");

      const d = snap.data() as any;
      if (d.used) throw new Error("CODE_USED");
      const now = Date.now();
      const expMs = d.expiresAtMs ?? d.expiresAt; // tương thích cũ
      if (expMs && Number(expMs) < now) throw new Error("CODE_EXPIRED");

      const uid = d.uid;
      if (!uid) throw new Error("MISSING_UID");

      // cập nhật code & mapping
      tx.set(
        codeRef,
        {
          used: true,
          usedAt: FieldValue.serverTimestamp(),
          linkedZaloUserId: zaloUserId,
        },
        { merge: true }
      );

      tx.set(
        db.collection("userNotificationPreferences").doc(uid),
        {
          contact: { zaloUserId },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, linked: true });
  } catch (err: any) {
    log("link error", err?.message || err);
    // vẫn trả 200 để OA không spam retry
    return NextResponse.json({ ok: true, linked: false, reason: String(err?.message || err) });
  }
}

// (tùy chọn) OA đôi khi gọi GET để health-check
export async function GET() {
  return NextResponse.json({ ok: true });
}
