'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Link2, MessageSquareText, Loader, Unlink as UnlinkIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { getLinkStatus, ensureLinkCode, unlinkZalo } from '@/src/lib/zalo/zalo-link';
import { enqueueNotification } from '@/src/lib/notify';

type Props = { uid: string; templateId?: string };

export default function ZaloLinkCard({ uid, templateId = 'test_zalo' }: Props) {
  const [loading, setLoading] = useState(false);
  const [zaloId, setZaloId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);

  // đồng hồ 1s cho countdown TTL
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ---- helpers ----
  const refreshStatus = useCallback(async () => {
    if (!uid) return;
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
    }
  }, [uid]);

  // tải trạng thái lần đầu
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setMsg(null);
    refreshStatus().finally(() => setLoading(false));
  }, [uid, refreshStatus]);

  // auto-poll mỗi 2s đến khi linked hoặc hết hạn (tối đa ~2 phút)
  useEffect(() => {
    if (zaloId || !code || !expiresAtMs) return;
    let stopped = false;
    let tries = 0;

    const tick = async () => {
      if (stopped) return;
      await refreshStatus();
      tries++;
      const expired = expiresAtMs <= Date.now();
      if (!zaloId && !expired && tries < 60) {
        setTimeout(tick, 2000);
      }
    };

    const id = setTimeout(tick, 2000);
    return () => {
      stopped = true;
      clearTimeout(id);
    };
  }, [zaloId, code, expiresAtMs, refreshStatus]);

  // ---- actions ----
  const genCode = async () => {
    if (!uid) return;
    setLoading(true);
    setMsg(null);
    try {
      const { code, expiresAtMs } = await ensureLinkCode(uid, 10); // TTL 10'
      setCode(code);
      setExpiresAtMs(expiresAtMs);
      setZaloId(null);
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

  const doUnlink = async () => {
    if (!uid) return;
    if (!confirm('Hủy liên kết Zalo với tài khoản này?')) return;
    setLoading(true);
    setMsg(null);
    try {
      await unlinkZalo(uid);
      setZaloId(null);
      setCode(null);
      setExpiresAtMs(undefined);
      setMsg('Đã hủy liên kết. Tạo mã mới để liên kết lại.');
      // refetch để chắc chắn
      await refreshStatus();
    } catch (e: any) {
      setMsg(e?.message || 'Không hủy liên kết được');
    } finally {
      setLoading(false);
    }
  };

  const ttlLabel = useMemo(() => {
    if (!expiresAtMs) return '';
    const remain = expiresAtMs - now;
    if (remain <= 0) return 'Hết hạn — tạo mã mới';
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    return `Hết hạn sau ${m}m${s.toString().padStart(2, '0')}s`;
  }, [expiresAtMs, now]);

  // ---- UI ----
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareText className="w-5 h-5 text-sky-600" />
        <h3 className="font-semibold">Zalo</h3>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => { setLoading(true); refreshStatus().finally(() => setLoading(false)); }}
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
        </Button>
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
          <>
            <span className="text-xs text-gray-500">
              zaloUserId: <b>{zaloId}</b>
            </span>
            <Button
              variant="outline"
              onClick={doUnlink}
              disabled={loading}
              className="ml-auto"
              title="Hủy liên kết Zalo (QA)"
            >
              <UnlinkIcon className="w-4 h-4 mr-2" /> Hủy liên kết
            </Button>
          </>
        )}
      </div>

      {msg && <p className="text-xs text-gray-600">{msg}</p>}
    </div>
  );
}
