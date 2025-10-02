import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, Timestamp } from "@/src/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_SECRET = process.env.ZALO_APP_SECRET || "";
const APP_ID     = process.env.ZALO_APP_ID || ""; // "1297631520475149508"
const ALLOW_UNSIGNED = process.env.ZALO_ACCEPT_NO_SIGNATURE === "1";

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

// Lấy token CUỐI sau "link", chấp nhận cả "link-LINK-XXXX"
function extractLinkCode(text: string): string | null {
  if (!text) return null;
  const m = /link[\s:_-]*([A-Za-z0-9][A-Za-z0-9-_]*)/i.exec(text);
  if (m && m[1]) {
    const tokens = m[1].split(/[^A-Za-z0-9]+/).filter(Boolean);
    const last = tokens.pop();
    if (last && last.length >= 4 && last.length <= 32) return last.toUpperCase();
  }
  return null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-zalo-signature") || req.headers.get("X-Zalo-Signature");
  const ip  = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  const ua  = req.headers.get("user-agent") || "";

  // Parse JSON SỚM để phân biệt ping vs event
  let body: any = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* body = {} */ }

  const eventName = String(body?.event_name || "");
  const hasMessage =
    !!body?.message?.text ||
    eventName === "user_send_text" ||
    (Array.isArray(body?.events) && body.events.some((e: any) => e?.message?.text || e?.event_name === "user_send_text"));

  console.log("[ZALO] hit", { ip, len: raw.length, hasSig: !!sig, ua, eventName, hasMessage });

  // ✅ Portal "Kiểm tra": không chữ ký và KHÔNG có message/event_name
  const isPortalPing = !sig && !hasMessage;
  if (isPortalPing) {
    console.log("[ZALO] portal ping OK");
    return NextResponse.json({ ok: true, ping: "zalo-portal" });
  }

  // ✅ Event thật:
  // 1) Có chữ ký ⇒ bắt buộc khớp
  if (sig) {
    if (!verifySignature(raw, sig)) {
      console.warn("[ZALO] signature mismatch");
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }
  } else {
    // 2) Không chữ ký ⇒ chỉ chấp nhận khi mở cờ QA và app_id đúng
    if (!ALLOW_UNSIGNED) {
      console.warn("[ZALO] unsigned event rejected");
      return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 401 });
    }
    if (APP_ID && String(body?.app_id || "") !== APP_ID) {
      console.warn("[ZALO] unsigned event app_id mismatch", { got: body?.app_id, expect: APP_ID });
      return NextResponse.json({ ok: false, error: "app_id_mismatch" }, { status: 401 });
    }
    console.log("[ZALO] unsigned event accepted (guarded by APP_ID)");
  }

  const zaloUserId = extractZaloUserId(body);
  const text = extractText(body);
  console.log("[ZALO] message", (text || "").slice(0, 80));
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

      const expMs = d.expiresAtMs ?? d.expiresAt;
      if (expMs && Number(expMs) < Date.now()) throw new Error("CODE_EXPIRED");

      const uid = d.uid;
      if (!uid) throw new Error("MISSING_UID");

      tx.set(codeRef, { used: true, usedAt: Timestamp.now(), linkedZaloUserId: zaloUserId }, { merge: true });
      tx.set(db.collection("userNotificationPreferences").doc(uid), { contact: { zaloUserId }, updatedAt: Timestamp.now() }, { merge: true });
    });

    return NextResponse.json({ ok: true, linked: true });
  } catch (err: any) {
    console.warn("[ZALO] link error", err?.message || err);
    return NextResponse.json({ ok: true, linked: false, reason: String(err?.message || err) });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
