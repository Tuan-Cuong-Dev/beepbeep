// src/components/business/about/BusinessAboutSection.tsx
// Bắt đầu thiết kế cái này từ 12.08.2025
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BusinessType } from '@/src/lib/my-business/businessTypes';
import { Mail, Phone, MapPin, Globe, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

type BaseBusiness = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  displayAddress?: string;
  mapAddress?: string;     // có thể là text địa chỉ hoặc URL maps
  mapUrl?: string;         // URL Google Maps chuẩn, nếu bạn lưu trực tiếp
  location?: unknown;      // cho phép string | [lat,lng] | {lat,lng} | {latitude,longitude}
  website?: string;
  openingHours?: string;
  description?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
};

const COLLECTION_BY_TYPE: Record<BusinessType, string> = {
  rental_company: 'rentalCompanies',
  private_provider: 'privateProviders',
  agent: 'agents',
  technician_partner: 'technicianPartners',
  intercity_bus: 'intercityBusCompanies',
  vehicle_transport: 'vehicleTransporters',
  tour_guide: 'tourGuides',
};

interface Props {
  businessId: string;
  businessType: BusinessType;
  className?: string;
}

export default function BusinessAboutSection({ businessId, businessType, className }: Props) {
  const { t } = useTranslation('common');
  const [data, setData] = useState<BaseBusiness | null>(null);
  const [loading, setLoading] = useState(true);

  const collectionName = useMemo(() => COLLECTION_BY_TYPE[businessType], [businessType]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(collection(db, collectionName), businessId));
        if (mounted && snap.exists()) setData({ id: snap.id, ...(snap.data() as any) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [businessId, collectionName]);

  if (loading) {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-lg p-5 shadow-sm', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-lg p-5 shadow-sm', className)}>
        <p className="text-sm text-red-600">{t('business_about.not_found')}</p>
      </div>
    );
  }

  // Chuẩn hoá đường dẫn gọi điện & bản đồ
  const phoneHref = data.phone ? `tel:${formatPhone(data.phone)}` : '';
  const mapsHref = buildGoogleMapsUrl({
    mapUrl: data.mapUrl as string | undefined,
    mapAddress: data.mapAddress ?? data.displayAddress,
    location: data.location,
  });

  return (
    <section className={cn('bg-white border border-gray-200 rounded-lg shadow-sm p-5 sm:p-6', className)}>
      {/* Title */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{data.name}</h2>
        {data.description && (
          <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{data.description}</p>
        )}
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {data.displayAddress && (
          <InfoRow
            icon={<MapPin className="size-3.5" />}
            label={t('business_about.address')}
            value={data.displayAddress}
          />
        )}
        {data.phone && (
          <InfoRow
            icon={<Phone className="size-3.5" />}
            label={t('business_about.phone')}
            value={data.phone}
            href={phoneHref}
          />
        )}
        {data.email && (
          <InfoRow
            icon={<Mail className="size-3.5" />}
            label={t('business_about.email')}
            value={data.email}
            href={`mailto:${data.email}`}
          />
        )}
        {data.website && (
          <InfoRow
            icon={<Globe className="size-3.5" />}
            label={t('business_about.website')}
            value={normalizeUrl(data.website)}
            href={normalizeUrl(data.website)}
            external
          />
        )}
        {data.openingHours && (
          <InfoRow
            icon={<Clock className="size-3.5" />}
            label={t('business_about.opening_hours')}
            value={data.openingHours}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        {phoneHref && (
          <Button className="w-full sm:w-auto" asChild>
            <a href={phoneHref}>{t('business_about.call_now')}</a>
          </Button>
        )}
        {mapsHref && (
          <Button className="w-full sm:w-auto" variant="outline" asChild>
            <a target="_blank" rel="noopener noreferrer" href={mapsHref}>
              {t('business_about.get_directions')}
            </a>
          </Button>
        )}
      </div>

      {/* Socials */}
      {data.socials && Object.values(data.socials).some(Boolean) && (
        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">{t('business_about.socials')}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            {data.socials.facebook && <SocialLink label="Facebook" href={normalizeUrl(data.socials.facebook)} />}
            {data.socials.instagram && <SocialLink label="Instagram" href={normalizeUrl(data.socials.instagram)} />}
            {data.socials.tiktok && <SocialLink label="TikTok" href={normalizeUrl(data.socials.tiktok)} />}
            {data.socials.youtube && <SocialLink label="YouTube" href={normalizeUrl(data.socials.youtube)} />}
          </div>
        </div>
      )}
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const row = (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 hover:border-gray-200">
      <div className="mt-[2px] text-gray-500 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-words whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
  if (!href) return row;
  return (
    <a
      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00d289]"
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {row}
    </a>
  );
}

function SocialLink({ label, href }: { label: string; href: string }) {
  const h = normalizeUrl(href);
  return (
    <a
      className="px-3 py-1.5 rounded-full border text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00d289]"
      href={h}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

/* ============== Helpers ============== */

function isUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeUrl(url?: string): string {
  if (!url) return '';
  if (isUrl(url)) return url;
  // nếu thiếu protocol, thêm https://
  return `https://${url}`;
}

function formatPhone(phone?: string): string {
  if (!phone) return '';
  // chỉ giữ số và dấu +
  return phone.replace(/[^\d+]/g, '');
}

function buildGoogleMapsUrl(b: {
  mapUrl?: string;
  mapAddress?: string;
  location?: unknown;
}): string {
  try {
    // 1) Nếu có mapUrl là full URL -> dùng luôn
    if (isUrl(b.mapUrl)) return b.mapUrl!;

    // 2) Nếu mapAddress là URL -> dùng luôn
    if (isUrl(b.mapAddress)) return b.mapAddress!;

    // 3) mapAddress text -> query=address
    if (typeof b.mapAddress === 'string' && b.mapAddress.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        b.mapAddress.trim()
      )}`;
    }

    // 4) location: hỗ trợ string/array/object
    const loc = b.location as
      | string
      | { lat?: number | string; lng?: number | string; latitude?: number | string; longitude?: number | string }
      | [number | string, number | string]
      | undefined;

    // 4a) string "16.07,108.2"
    if (typeof loc === 'string') {
      const nums = loc.match(/-?\d+(\.\d+)?/g);
      if (nums && nums.length >= 2) {
        const [lat, lng] = nums;
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    // 4b) array [lat, lng]
    if (Array.isArray(loc) && loc.length >= 2) {
      const [lat, lng] = loc;
      if (lat != null && lng != null) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    // 4c) object {lat,lng} hoặc {latitude,longitude}
    if (loc && typeof loc === 'object') {
      // @ts-ignore
      const lat = (loc.lat ?? loc.latitude) as number | string | undefined;
      // @ts-ignore
      const lng = (loc.lng ?? loc.longitude) as number | string | undefined;
      if (lat != null && lng != null) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    // Không build được
    return '';
  } catch {
    return '';
  }
}
