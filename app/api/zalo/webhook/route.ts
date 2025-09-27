// /app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// trả về kết quả gửi để debug
async function sendCsMessage(userId: string, text: string) {
  const accessToken = process.env.ZALO_OA_ACCESS_TOKEN; // TODO: lấy từ DB khi lên prod
  if (!accessToken) return { ok: false, reason: "NO_TOKEN" };

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

  let data: any = null;
  try { data = await res.json(); } catch { /* noop */ }

  return { ok: res.ok && !(data && data.error), status: res.status, data };
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ZALO_APP_SECRET;
    if (!secret) return new NextResponse("Server misconfigured", { status: 500 });

    const raw = await req.text();
    const sig = (req.headers.get("x-zalo-signature") || "").trim();
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    const hex = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const b64 = Buffer.from(hex, "hex").toString("base64");
    const okSig = safeEqual(sig.toLowerCase(), hex.toLowerCase()) || safeEqual(sig, b64);
    if (!okSig) return new NextResponse("Invalid signature", { status: 401 });

    const body = JSON.parse(raw);

    // 🔧 CHỖ QUAN TRỌNG: AWAIT để đảm bảo gửi xong rồi mới trả response
    let autoReply: any = null;
    if (body?.event_name === "user_send_text") {
      const uid = body?.sender?.id as string | undefined;
      const txt = (body?.message?.text as string | undefined) || "";
      if (uid) {
        autoReply = await sendCsMessage(uid, `Bíp Bíp đã nhận: "${txt}" ✅`);
      }
    }

    return NextResponse.json({ ok: true, autoReply });
  } catch (e) {
    console.error("Webhook error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
