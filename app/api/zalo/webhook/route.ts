// /app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs"; // BẮT BUỘC: dùng Node, không chạy Edge

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ZALO_APP_SECRET;
    if (!secret) {
      console.error("ZALO_APP_SECRET is missing");
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    // 1) Lấy raw body
    const raw = await req.text();

    // 2) Header chữ ký
    const sig = (req.headers.get("x-zalo-signature") || "").trim();
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    // 3) Tính HMAC (hex)
    const h = crypto.createHmac("sha256", secret);
    h.update(raw);
    const hex = h.digest("hex");
    const b64 = Buffer.from(hex, "hex").toString("base64");

    // 4) So sánh an toàn (support cả hex lẫn base64)
    const ok =
      safeEqual(sig.toLowerCase(), hex.toLowerCase()) || safeEqual(sig, b64);

    if (!ok) return new NextResponse("Invalid signature", { status: 401 });

    // 5) Parse JSON sau khi xác thực
    const body = JSON.parse(raw);

    // TODO: xử lý body.event_name...
    // ví dụ ghi log nhẹ để debug:
    console.log("Webhook OK:", { event_name: body.event_name });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
