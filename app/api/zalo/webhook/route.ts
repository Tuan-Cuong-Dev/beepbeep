// /app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// DEMO ONLY: gửi CS message (sau này thay bằng token lấy từ DB)
async function sendCsMessage(userId: string, text: string) {
  const accessToken = process.env.ZALO_OA_ACCESS_TOKEN; // TODO: lấy từ DB
  if (!accessToken) {
    console.warn("ZALO_OA_ACCESS_TOKEN missing; skip auto-reply");
    return;
  }
  const res = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "access_token": accessToken,
    },
    body: JSON.stringify({
      recipient: { user_id: userId },
      message: { text },
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    console.error("sendCsMessage failed", res.status, j);
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ZALO_APP_SECRET;
    if (!secret) {
      console.error("ZALO_APP_SECRET is missing");
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    // 1) Raw body (phải đọc trước khi parse)
    const raw = await req.text();
    if (!raw) return NextResponse.json({ ok: false, reason: "EMPTY_BODY" }, { status: 400 });

    // 2) Signature header
    const sig = (req.headers.get("x-zalo-signature") || "").trim();
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    // 3) HMAC-SHA256 (hex + base64)
    const h = crypto.createHmac("sha256", secret);
    h.update(raw);
    const hex = h.digest("hex");
    const b64 = Buffer.from(hex, "hex").toString("base64");

    const ok = safeEqual(sig.toLowerCase(), hex.toLowerCase()) || safeEqual(sig, b64);
    if (!ok) return new NextResponse("Invalid signature", { status: 401 });

    // 4) Parse JSON sau khi xác thực
    const body = JSON.parse(raw);

    // 5) Xử lý tối thiểu (non-blocking)
    // Lưu ý: đưa thao tác IO nặng (DB/HTTP khác) sang queue/background
    // Ở đây demo auto-reply khi user gửi text
    if (body?.event_name === "user_send_text") {
      const uid = body?.sender?.id as string | undefined;
      const text = body?.message?.text as string | undefined;
      if (uid && text) {
        // không chặn response: fire and forget
        sendCsMessage(uid, `Bíp Bíp đã nhận: "${text}" ✅`).catch(() => {});
      }
    }

    // 6) Phản hồi ngay cho Zalo
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
