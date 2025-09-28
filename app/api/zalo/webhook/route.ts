// /app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs"; // quan trọng

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ZALO_APP_SECRET;
    const fnBase = process.env.FUNCTIONS_BASE_URL; // ví dụ https://asia-southeast1-<project>.cloudfunctions.net
    const internal = process.env.INTERNAL_WORKER_SECRET;

    if (!secret || !fnBase || !internal) {
      console.error("Missing env", { hasSecret: !!secret, hasFnBase: !!fnBase, hasInternal: !!internal });
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    // 1) raw body + signature verify
    const raw = await req.text();
    const sig = (req.headers.get("x-zalo-signature") || "").trim();
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    const h = crypto.createHmac("sha256", secret);
    h.update(raw);
    const hex = h.digest("hex");
    const b64 = Buffer.from(hex, "hex").toString("base64");

    const ok = safeEqual(sig.toLowerCase(), hex.toLowerCase()) || safeEqual(sig, b64);
    if (!ok) return new NextResponse("Invalid signature", { status: 401 });

    // 2) parse JSON sau khi verify
    const body = JSON.parse(raw);
    const eventName: string = body?.event_name || body?.event || "unknown";

    // Try best-effort lấy Zalo user id từ các nơi có thể xuất hiện
    const zaloUserId: string | undefined =
      body?.sender?.id ||
      body?.follower?.id ||
      body?.user_id ||
      body?.user?.id;

    // 3) Phân loại
    // 3.a) user_send_text có LINK-<code>
    if (eventName === "user_send_text") {
      const text: string = body?.message?.text?.trim?.() || "";
      const m = text.match(/^LINK-([A-Za-z0-9_-]{4,})$/);
      if (m && zaloUserId) {
        const code = m[1];

        // forward sang Cloud Function để link account
        const r = await fetch(`${fnBase}/zaloIngest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internal
          },
          body: JSON.stringify({ action: "link", zaloUserId, code, raw: body })
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          console.error("link forward failed", r.status, t);
        }
      }
    }

    // 3.b) follow
    if (eventName === "user_follow" && zaloUserId) {
      await fetch(`${fnBase}/zaloIngest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": internal },
        body: JSON.stringify({ action: "follow", zaloUserId, raw: body })
      }).catch(() => null);
    }

    // 3.c) unfollow
    if (eventName === "user_unfollow" && zaloUserId) {
      await fetch(`${fnBase}/zaloIngest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": internal },
        body: JSON.stringify({ action: "unfollow", zaloUserId, raw: body })
      }).catch(() => null);
    }

    // Done
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    // Không để OA retry quá gắt
    return NextResponse.json({ ok: true });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
