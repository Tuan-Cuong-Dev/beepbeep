'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy, Link2, MessageSquareText, Loader, Unlink as UnlinkIcon, RefreshCw, Send
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { getLinkStatus, ensureLinkCode, unlinkZalo } from '@/src/lib/zalo/zalo-link';
import { enqueueNotification } from '@/src/lib/notify';
import { useTranslation } from 'react-i18next';

type Props = { uid: string; templateId?: string };

export default function ZaloLinkCard({ uid, templateId = 'test_zalo' }: Props) {
  const { t } = useTranslation('common', { useSuspense: false });

  const [loading, setLoading] = useState(false);
  const [zaloId, setZaloId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);

  // đồng hồ 1s cho countdown TTL
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tmr = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tmr);
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
      setMsg(t('zalo_link_card.errors.status_failed', 'Không tải được trạng thái liên kết'));
    }
  }, [uid, t]);

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
      setMsg(t('zalo_link_card.messages.create_success', 'Đã tạo mã. Mở Zalo, vào OA và gửi: LINK-{{code}}', { code }));
    } catch (e: any) {
      setMsg(t('zalo_link_card.errors.create_failed', 'Không tạo được mã'));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(`LINK-${code}`);
    setMsg(t('zalo_link_card.messages.copy_success', 'Đã copy: LINK-{{code}}', { code }));
  };

  const sendTest = async () => {
    if (!uid) return;
    setLoading(true);
    setMsg(null);
    try {
      await enqueueNotification({
        templateId,
        audience: { type: 'user', uid },
        data: { name: t('zalo_link_card.default_name', 'Bạn') },
        requiredChannels: ['zalo', 'inapp'],
        topic: 'demo',
      });
      setMsg(t('zalo_link_card.messages.enqueue_success', 'Đã đưa vào hàng đợi — kiểm tra Zalo & In-app.'));
    } catch (e: any) {
      setMsg(t('zalo_link_card.errors.enqueue_failed', 'Không gửi được'));
    } finally {
      setLoading(false);
    }
  };

  const doUnlink = async () => {
    if (!uid) return;
    if (!confirm(t('zalo_link_card.confirm.unlink', 'Hủy liên kết Zalo với tài khoản này?'))) return;
    setLoading(true);
    setMsg(null);
    try {
      await unlinkZalo(uid);
      setZaloId(null);
      setCode(null);
      setExpiresAtMs(undefined);
      setMsg(t('zalo_link_card.messages.unlink_success', 'Đã hủy liên kết. Tạo mã mới để liên kết lại.'));
      await refreshStatus();
    } catch (e: any) {
      setMsg(t('zalo_link_card.errors.unlink_failed', 'Không hủy liên kết được'));
    } finally {
      setLoading(false);
    }
  };

  const ttlLabel = useMemo(() => {
    if (!expiresAtMs) return '';
    const remain = expiresAtMs - now;
    if (remain <= 0) return t('zalo_link_card.ttl.expired', 'Hết hạn — tạo mã mới');
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    return t('zalo_link_card.ttl.in', 'Hết hạn sau {{m}}m{{s}}s', {
      m,
      s: String(s).toString().padStart(2, '0')
    });
  }, [expiresAtMs, now, t]);

  // ---- sub components ----
  const StatusBadge = ({ linked }: { linked: boolean }) => (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        linked
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          linked ? 'bg-emerald-500' : 'bg-amber-500',
        ].join(' ')}
      />
      {linked
        ? t('zalo_link_card.status.linked', 'ĐÃ LIÊN KẾT')
        : t('zalo_link_card.status.unlinked', 'CHƯA LIÊN KẾT')}
    </span>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-sky-50 p-2">
          <MessageSquareText className="h-5 w-5 text-sky-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800">
            {t('zalo_link_card.title', 'Zalo')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('zalo_link_card.subtitle', 'Liên kết tài khoản Zalo với hồ sơ của bạn')}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <StatusBadge linked={!!zaloId} />
          <Button
            variant="ghost"
            size="sm"
            className="ml-1"
            title={t('zalo_link_card.refresh', 'Làm mới')}
            onClick={() => {
              setLoading(true);
              refreshStatus().finally(() => setLoading(false));
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading line */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader className="h-4 w-4 animate-spin" />
          <span>{t('zalo_link_card.loading', 'Đang xử lý…')}</span>
        </div>
      )}

      {/* Body */}
      <div className="mt-4 space-y-4">
        {!zaloId && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 text-sm font-medium text-slate-700">
              {t('zalo_link_card.step1_title', 'Bước 1 · Tạo mã liên kết')}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={genCode} disabled={loading} className="sm:w-auto">
                <Link2 className="mr-2 h-4 w-4" /> {t('zalo_link_card.create_code', 'Tạo mã')}
              </Button>

              <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <code className="flex-1 truncate font-mono text-sm text-slate-800">
                  {code ? `LINK-${code}` : 'LINK-········'}
                </code>
                <Button variant="ghost" size="sm" onClick={copyCode} disabled={!code}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('zalo_link_card.copy', 'Sao chép')}
                </Button>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {t('zalo_link_card.step2_instruction', 'Bước 2 · Mở Zalo → Chat với OA → gửi tin:')}{" "}
              <b>{`LINK-${code ?? t('zalo_link_card.placeholder_code', 'MÃ')}`}</b>.{" "}
              {t('zalo_link_card.webhook_hint', 'Webhook sẽ tự map tài khoản.')}{' '}
              {ttlLabel && <span>({ttlLabel})</span>}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={sendTest} disabled={loading || !uid} className="sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            {t('zalo_link_card.send_test', 'Gửi thử qua Zalo')}
          </Button>

          {zaloId && (
            <div className="flex w-full flex-1 items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="mr-1 text-slate-500">
                  {t('zalo_link_card.zalo_user_id', 'zaloUserId')}:
                </span>
                <b className="font-mono">{zaloId}</b>
              </div>

              <Button
                variant="outline"
                onClick={doUnlink}
                disabled={loading}
                title={t('zalo_link_card.unlink', 'Hủy liên kết')}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <UnlinkIcon className="mr-2 h-4 w-4" /> {t('zalo_link_card.unlink', 'Hủy liên kết')}
              </Button>
            </div>
          )}
        </div>

        {msg && (
          <p className="text-xs text-slate-600" aria-live="polite">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
