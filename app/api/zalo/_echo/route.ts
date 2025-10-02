// Mục tiêu: endpoint này không kiểm chữ ký – chỉ để kiểm chứng OA có bắn event message tới server 
// hay không, và header/body như thế nào.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";

  console.log("[ZALO][ECHO] hit", {
    ip,
    len: raw.length,
    hasSig: !!req.headers.get("x-zalo-signature"),
    headersSample: {
      "user-agent": headers["user-agent"],
      "content-type": headers["content-type"],
      "x-zalo-signature": headers["x-zalo-signature"] ? "(present)" : "(none)",
      "x-forwarded-for": headers["x-forwarded-for"],
      host: headers["host"],
    },
    bodyPreview: raw.slice(0, 200),
  });

  return new NextResponse(
    JSON.stringify({ ok: true, got: raw.length, headers: headers["user-agent"] }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST here to echo/log" });
}
