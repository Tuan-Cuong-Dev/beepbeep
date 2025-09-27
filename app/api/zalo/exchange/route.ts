// /app/api/zalo/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const res = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'secret_key': process.env.ZALO_APP_SECRET!,
    },
    body: new URLSearchParams({
      app_id: process.env.ZALO_APP_ID!,
      grant_type: 'authorization_code',
      code,
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  // TODO: lưu data.access_token + data.refresh_token vào DB/Firestore
  return NextResponse.json(data);
}
