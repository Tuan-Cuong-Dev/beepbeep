import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const ip = (headers["x-forwarded-for"] || "").split(",")[0]?.trim() || "unknown";
  const hasSig = !!headers["x-zalo-signature"];

  console.log("[ZALO][ECHO] hit", {
    ip,
    len: raw.length,
    hasSig,
    ua: headers["user-agent"],
    bodyPreview: raw.slice(0, 200),
  });

  return NextResponse.json({ ok: true, got: raw.length });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST here to echo/log" });
}
