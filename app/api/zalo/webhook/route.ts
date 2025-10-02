import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, FieldValue, Timestamp } from "@/src/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_SECRET = process.env.ZALO_APP_SECRET || "";

function verifySignature(raw: string, headerSig?: string | null): boolean {
  if (!headerSig || !APP_SECRET) return false;
  const hex = crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex");
  const b64 = crypto.createHmac("sha256", APP_SECRET).update(raw).digest("base64");
  return headerSig === hex || headerSig === b64;
}

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
      if (typeof e?.payload === "string") return e.payload;
    }
  }
  return "";
}

// Thay thế hàm cũ bằng hàm dưới
function extractLinkCode(text: string): string | null {
  if (!text) return null;

  // 1) Ưu tiên chuỗi sau "link" (link-ABCD, LINK: ABCD, link__ABCD, link-LINK-ABCD, ...)
  const m = /link[\s:_-]*([A-Za-z0-9][A-Za-z0-9-_]*)/i.exec(text);
  if (m && m[1]) {
    // tách theo ký tự không phải a-z0-9, lấy token CUỐI
    const tokens = m[1].split(/[^A-Za-z0-9]+/).filter(Boolean);
    const last = tokens.pop();
    if (last && last.length >= 4 && last.length <= 32) return last.toUpperCase();
  }

  // 2) (tuỳ chọn) fallback: nếu user chỉ gửi "ABCD12" không có "link"
  // bật nếu bạn muốn chấp nhận cả mã trần
  // const m2 = /([A-Za-z0-9]{4,32})/.exec(text);
  // if (m2) return m2[1].toUpperCase();

  return null;
}


export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-zalo-signature") || req.headers.get("X-Zalo-Signature");
  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok:false, error:"invalid_json" }, { status: 400 }); }

  const zaloUserId = extractZaloUserId(body);
  const text = extractText(body);
  const code = extractLinkCode(text);

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
      const expMs = d.expiresAtMs ?? d.expiresAt;
      if (expMs && Number(expMs) < now) throw new Error("CODE_EXPIRED");

      const uid = d.uid;
      if (!uid) throw new Error("MISSING_UID");

      tx.set(codeRef, { used: true, usedAt: Timestamp.now(), linkedZaloUserId: zaloUserId }, { merge: true });
      tx.set(db.collection("userNotificationPreferences").doc(uid), { contact: { zaloUserId }, updatedAt: Timestamp.now() }, { merge: true });
    });

    return NextResponse.json({ ok: true, linked: true });
  } catch (err: any) {
    return NextResponse.json({ ok: true, linked: false, reason: String(err?.message || err) });
  }
}

export async function GET() {
  // Healthcheck đơn giản
  return NextResponse.json({ ok: true });
}
