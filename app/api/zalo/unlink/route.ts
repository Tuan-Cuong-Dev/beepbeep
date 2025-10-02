import { NextRequest, NextResponse } from "next/server";
import { db, Timestamp } from "@/src/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Bảo vệ đơn giản bằng secret header (chỉ dùng cho QA)
  const secret = req.headers.get("x-internal-secret") || "";
  if (secret !== (process.env.INTERNAL_WORKER_SECRET || "")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { uid, zaloUserId } = await req.json();

  if (!uid && !zaloUserId) {
    return NextResponse.json({ ok: false, error: "missing_uid_or_zaloUserId" }, { status: 400 });
  }

  try {
    await db.runTransaction(async (tx) => {
      let _uid = uid;
      let _zalo = zaloUserId;

      // Nếu chỉ biết uid → lấy zaloUserId
      if (_uid && !_zalo) {
        const prefRef = db.collection("userNotificationPreferences").doc(_uid);
        const prefSnap = await tx.get(prefRef);
        _zalo = prefSnap.exists ? prefSnap.data()?.contact?.zaloUserId : null;
      }

      if (!_uid || !_zalo) throw new Error("LINK_NOT_FOUND");

      // Xoá mapping phía user
      tx.set(
        db.collection("userNotificationPreferences").doc(_uid),
        { contact: { zaloUserId: null }, updatedAt: Timestamp.now() },
        { merge: true }
      );

      // Nếu có bảng ánh xạ ngược `zalo_links/{zaloUserId}`, có thể xoá thêm:
      // tx.delete(db.collection("zalo_links").doc(_zalo));
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
