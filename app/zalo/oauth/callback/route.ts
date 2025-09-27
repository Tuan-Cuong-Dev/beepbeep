// /app/zalo/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  return NextResponse.json({ ok: !!code, code });
}
