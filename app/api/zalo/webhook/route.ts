import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, FieldValue } from '@/src/lib/firebaseAdmin';

export const runtime = 'nodejs'; // cần Node để dùng crypto

const APP_SECRET = process.env.ZALO_APP_SECRET!;
const SKIP_SIG = process.env.ZALO_SKIP_SIGNATURE === '1'; // chỉ dùng khi test

function verifySignature(raw: string, headerSig?: string | null): boolean {
  if (SKIP_SIG) return true;
  if (!headerSig || !APP_SECRET) return false;
  const h1 = crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');
  const h2 = crypto.createHmac('sha256', APP_SECRET).update(raw).digest('base64');
  return headerSig === h1 || headerSig === h2;
}

function extractZaloUserId(body: any): string | null {
  return (
    body?.sender?.id ||
    body?.from?.id ||
    body?.user_id ||
    body?.message?.user_id ||
    null
  );
}

function extractText(body: any): string {
  return body?.message?.text || body?.message?.content || '';
}

function extractLinkCode(text: string): string | null {
  // hỗ trợ: "link-ABC123", "Link ABC123", "LINK_ABC123"
  const m = /link[\s:_-]*([A-Za-z0-9]{4,32})/i.exec(text);
  return m?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get('x-zalo-signature') || req.headers.get('X-Zalo-Signature');

  if (!verifySignature(raw, sig)) {
    console.error('[ZALO] signature mismatch');
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch (e) {
    console.error('[ZALO] invalid JSON body');
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const zaloUserId = extractZaloUserId(body);
  const text = extractText(body);
  const code = extractLinkCode(text);

  if (!zaloUserId || !code) {
    console.warn('[ZALO] missing zaloUserId or code', { zaloUserId, text });
    return NextResponse.json({ ok: true }); // vẫn 200 để OA không retry, nhưng không liên kết
  }

  const codeRef = db.collection('zalo_link_codes').doc(code);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(codeRef);
      if (!snap.exists) throw new Error('INVALID_CODE');

      const d = snap.data() as any;
      if (d.used) throw new Error('CODE_USED');
      if (d.expiresAtMs && d.expiresAtMs < Date.now()) throw new Error('CODE_EXPIRED');

      const uid = d.uid;
      if (!uid) throw new Error('MISSING_UID');

      // cập nhật code & mapping
      tx.set(codeRef, {
        used: true,
        usedAt: FieldValue.serverTimestamp(),
        linkedZaloUserId: zaloUserId
      }, { merge: true });

      tx.set(db.collection('userNotificationPreferences').doc(uid), {
        contact: { zaloUserId }
      }, { merge: true });
    });

    // (tùy chọn) gửi reply qua OA API nếu bạn muốn — có thể thêm sau
    return NextResponse.json({ ok: true, linked: true });
  } catch (err: any) {
    console.error('[ZALO] link error', err?.message);
    // vẫn trả 200 để OA không spam retry, kèm reason cho bạn xem log
    return NextResponse.json({ ok: true, linked: false, reason: String(err?.message || err) });
  }
}

// (tùy chọn) OA đôi khi gọi GET để health-check
export async function GET() {
  return NextResponse.json({ ok: true });
}
