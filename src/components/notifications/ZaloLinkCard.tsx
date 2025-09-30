'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, MessageSquareText, Loader } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { getLinkStatus, ensureLinkCode } from '@/src/lib/zalo-link';
import { enqueueNotification } from '@/src/lib/notify';

type Props = { uid: string; templateId?: string };

export default function ZaloLinkCard({ uid, templateId = 'test_zalo' }: Props) {
  const [loading, setLoading] = useState(false);
  const [zaloId, setZaloId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);

  // tải trạng thái ban đầu
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const st = await getLinkStatus(uid);
        if (st.linked) {
          setZaloId(st.zaloUserId ?? null);
          setCode(null);
          setExpiresAtMs(undefined);
        } else {
          setZaloId(null);
          setCode(st.code ?? null);
          setExpiresAtMs(st.expiresAtMs);
        }
      } catch (e: any) {
        setMsg(e?.message || 'Không tải được trạng thái liên kết');
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const genCode = async () => {
    if (!uid) return;
    setLoading(true);
    setMsg(null);
    try {
      const { code, expiresAtMs } = await ensureLinkCode(uid, 10); // TTL 10'
      setCode(code);
      setExpiresAtMs(expiresAtMs);
      setMsg('Đã tạo mã. Mở Zalo, vào OA và gửi: LINK-' + code);
    } catch (e: any) {
      setMsg(e?.message || 'Không tạo được mã');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(`LINK-${code}`);
    setMsg('Đã copy: LINK-' + code);
  };

  const sendTest = async () => {
    if (!uid) return;
    setLoading(true);
    setMsg(null);
    try {
      await enqueueNotification({
        templateId,
        audience: { type: 'user', uid },
        data: { name: 'Bạn' },
        requiredChannels: ['zalo', 'inapp'],
        topic: 'demo',
      });
      setMsg('Đã đưa vào hàng đợi — kiểm tra Zalo & In-app.');
    } catch (e: any) {
      setMsg(e?.message || 'Không gửi được');
    } finally {
      setLoading(false);
    }
  };

  const ttlLabel = useMemo(() => {
    if (!expiresAtMs) return '';
    const remain = expiresAtMs - Date.now();
    if (remain <= 0) return 'Hết hạn — tạo mã mới';
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    return `Hết hạn sau ${m}m${s.toString().padStart(2, '0')}s`;
  }, [expiresAtMs]);

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareText className="w-5 h-5 text-sky-600" />
        <h3 className="font-semibold">Zalo</h3>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" /> Đang xử lý…
        </p>
      )}

      <div className="text-sm text-gray-700">
        Trạng thái:{' '}
        {zaloId ? (
          <span className="text-green-700">ĐÃ LIÊN KẾT</span>
        ) : (
          <span className="text-amber-700">CHƯA LIÊN KẾT</span>
        )}
      </div>

      {!zaloId && (
        <div className="rounded-lg bg-slate-50 border p-3 space-y-2">
          <div className="text-sm">Bước 1: Tạo mã liên kết</div>
          <div className="flex gap-2">
            <Button onClick={genCode} disabled={loading}>
              <Link2 className="w-4 h-4 mr-2" /> Tạo mã
            </Button>
            <Button variant="ghost" onClick={copyCode} disabled={!code}>
              <Copy className="w-4 h-4 mr-2" /> Copy LINK-{code ?? '------'}
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Bước 2: Mở Zalo → chat với OA → gửi tin: <b>LINK-{code ?? 'MÃ'}</b>.
            Webhook sẽ tự map tài khoản. {ttlLabel && <span>({ttlLabel})</span>}
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <Button onClick={sendTest} disabled={loading || !uid}>
          Gửi thử qua Zalo
        </Button>
        {zaloId && (
          <span className="text-xs text-gray-500">
            zaloUserId: <b>{zaloId}</b>
          </span>
        )}
      </div>

      {msg && <p className="text-xs text-gray-600">{msg}</p>}
    </div>
  );
}
