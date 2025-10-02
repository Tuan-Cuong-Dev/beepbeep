import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/firebaseAdmin";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";  // tắt cache Next
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ ok: false, error: "missing_uid" }, { status: 400 });
  }

  try {
    // mapping chính
    const prefSnap = await db.collection("userNotificationPreferences").doc(uid).get();
    const zaloUserId: string | null = prefSnap.exists ? (prefSnap.data()?.contact?.zaloUserId ?? null) : null;

    // nếu chưa linked -> trả mã mới nhất còn hạn để hiển thị
    let code: string | null = null;
    let expiresAtMs: number | undefined = undefined;

    if (!zaloUserId) {
      const qs = await db.collection("zalo_link_codes")
        .where("uid", "==", uid)
        .where("used", "==", false)
        .orderBy("expiresAtMs", "desc")
        .limit(1)
        .get();

      if (!qs.empty) {
        const d = qs.docs[0];
        code = d.id; // docID = code
        const data = d.data() as any;
        expiresAtMs = data?.expiresAtMs ?? data?.expiresAt;
      }
    }

    return new NextResponse(
      JSON.stringify({ ok: true, linked: !!zaloUserId, zaloUserId, code, expiresAtMs }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[/api/zalo/status] error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
