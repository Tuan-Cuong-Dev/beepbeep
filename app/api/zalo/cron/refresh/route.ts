// /app/api/zalo/cron/refresh/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // TODO: đọc refresh_token hiện tại từ DB
  const appId = process.env.ZALO_APP_ID!;
  const appSecret = process.env.ZALO_APP_SECRET!;
  const refreshToken = /* lấy từ DB */ "";

  const body = new URLSearchParams({
    app_id: appId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: { secret_key: appSecret, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();

  // TODO: ghi lại access_token/refresh_token/expires_in vào DB
  return NextResponse.json(json);
}
