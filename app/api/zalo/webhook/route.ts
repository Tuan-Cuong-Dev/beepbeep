import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
export const runtime = "nodejs";

function safeEq(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.ZALO_APP_SECRET;
    if (!secret) return NextResponse.json({ ok: false, reason: "NO_ENV" }, { status: 500 });

    const raw = await req.text();
    const sig = (req.headers.get("x-zalo-signature") || "").trim();

    // Tính HMAC
    const h = crypto.createHmac("sha256", secret);
    h.update(raw);
    const hex = h.digest("hex");
    const b64 = Buffer.from(hex, "hex").toString("base64");

    if (!sig) return NextResponse.json({ ok: false, reason: "NO_SIG" }, { status: 400 });

    const ok = safeEq(sig.toLowerCase(), hex.toLowerCase()) || safeEq(sig, b64);
    if (!ok) {
      // Chỉ debug: trả về mẫu chữ ký mà server mong đợi để bạn đối chiếu
      return NextResponse.json({ ok: false, reason: "BAD_SIG", expect: { hex, b64 } }, { status: 401 });
    }

    // Xác thực xong mới parse
    const body = JSON.parse(raw);
    return NextResponse.json({ ok: true, event_name: body.event_name });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: "EX", message: String(e?.message || e) }, { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
