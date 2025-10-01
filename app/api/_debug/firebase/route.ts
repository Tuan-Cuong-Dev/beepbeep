// src/app/api/_debug/firebase/route.ts
import { NextResponse } from "next/server";
import { db, Timestamp, __adminLoadedVia } from "@/src/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ref = db.collection("_debug_admin_ping").doc();
    await ref.set({ at: Timestamp.now(), via: __adminLoadedVia || "unknown" });

    return NextResponse.json({
      ok: true,
      via: __adminLoadedVia,
      envPresence: {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_ADMIN_CREDENTIALS: !!process.env.FIREBASE_ADMIN_CREDENTIALS,
      },
      wroteDoc: ref.id,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      via: __adminLoadedVia,
      error: String(e?.message || e),
      envPresence: {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_ADMIN_CREDENTIALS: !!process.env.FIREBASE_ADMIN_CREDENTIALS,
      },
    }, { status: 500 });
  }
}
