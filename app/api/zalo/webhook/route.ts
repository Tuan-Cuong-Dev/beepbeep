// /app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Bắt buộc Node runtime (để dùng crypto Node)
export const runtime = "nodejs";

function constTimeEq(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  // 1) Lấy raw body để tính HMAC
  const raw = await req.text();

  // 2) Lấy chữ ký Zalo gửi kèm header
  const sig = (req.headers.get("x-zalo-signature") || "").trim();
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  // 3) Tính HMAC-SHA256(AppSecret, raw-body)
  const secret = process.env.ZALO_APP_SECRET!;
  const h = crypto.createHmac("sha256", secret).update(raw);
  const digestHex = h.digest("hex"); // đa số triển khai Zalo dùng hex
  // (phòng hờ) một số môi trường có thể so base64
  const digestB64 = Buffer.from(digestHex, "hex").toString("base64");

  const ok =
    constTimeEq(sig.toLowerCase(), digestHex.toLowerCase()) ||
    constTimeEq(sig, digestB64);

  if (!ok) return new NextResponse("Invalid signature", { status: 401 });

  // 4) Parse & xử lý sự kiện
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  // Ví dụ route theo event_name
  switch (body.event_name) {
    case "user_send_text":
      // body.sender: { id: user_id, ... }, body.message.text
      // TODO: lưu DB / đẩy queue / auto-reply...
      break;
    case "user_follow":
    case "user_unfollow":
      // TODO: cập nhật trạng thái theo dõi
      break;
    case "oa_send_msg_result":
      // TODO: cập nhật trạng thái gửi tin (delivered/failed)
      break;
    default:
      // log lại để theo dõi các event khác
      break;
  }

  // 5) Trả 200 thật nhanh — xử lý nặng đưa vào queue
  return NextResponse.json({ ok: true });
}

// (tuỳ chọn) chặn phương thức khác
export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
