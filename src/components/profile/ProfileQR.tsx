'use client';

import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import clsx from 'clsx';

type Props = {
  userId: string;
  baseUrl?: string;       // nếu không truyền: lấy window.origin → env → LAN
  size?: number;          // kích thước QR trên desktop (px). Mặc định: 96
  showUrl?: boolean;      // hiện URL bên phải (mặc định: false)
  className?: string;
  logoUrl?: string;       // (tuỳ chọn) logo nhỏ giữa QR
  title?: string;         // tiêu đề ngắn
  subtitle?: string;      // mô tả ngắn
};

export default function ProfileQR({
  userId,
  baseUrl,
  size = 96,
  showUrl = false,
  className,
  logoUrl,
  title = 'QR Showcase',
  subtitle = 'Scan để mở gian hàng',
}: Props) {
  const origin = useMemo(() => {
    if (baseUrl) return baseUrl;
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://beepbeep.vn';
  }, [baseUrl]);

  const url = `${origin}/profile?uid=${userId}&tab=showcase`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean | null>(null);

  // Copy: HTTPS dùng clipboard API, HTTP/LAN dùng fallback textarea
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(null), 1200);
        return;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(ok);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(false);
      setTimeout(() => setCopied(null), 1200);
    }
  };

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `qr-showcase-${userId}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div
      className={clsx(
        // card nhỏ, ưu tiên chiều ngang, chiều cao thấp
        'rounded-xl border shadow-sm bg-white p-3',
        'w-full',
        className
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* QR bên trái (co giãn nhẹ trên mobile) */}
        <div ref={wrapRef} className="shrink-0">
          <div className="relative">
            <QRCodeCanvas
              value={url}
              size={size}
              includeMargin
              style={{
                width: 'min(28vw, 112px)',   // mobile auto, trần 112px
                height: 'min(28vw, 112px)',
              }}
            />
            {logoUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  src={logoUrl}
                  alt="logo"
                  className="h-5 w-5 rounded bg-white/90 p-0.5 shadow"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        {/* Thông tin + nút bên phải */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
              {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
            </div>
          </div>

          {showUrl && (
            <div className="mt-1 text-[11px] text-gray-600 break-all">
              {url}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
              title="Copy link"
            >
              {copied === true ? 'Copied ✓' : copied === false ? 'Copy failed' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
              title="Download PNG"
            >
              PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
