// src/components/business/about/BusinessAboutSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BusinessType } from '@/src/lib/my-business/businessTypes';
import { Mail, Phone, MapPin, Globe, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

/* ================= Types ================= */

type BaseBusiness = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  displayAddress?: string;
  mapAddress?: string; // URL/text (đã chuẩn hoá)
  mapUrl?: string;     // URL Google Maps nếu lưu riêng
  location?:
    | string
    | { lat?: number; lng?: number; latitude?: number; longitude?: number }
    | [number, number];
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
  city_driver: 'cityDrivers',
  intercity_driver: 'intercityDrivers',
  delivery_partner: 'deliveryPartners'
};

interface Props {
  businessId: string;
  businessType: BusinessType;
  className?: string;
}

/* ============== Component ============== */

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
        if (!collectionName) {
          console.warn('Unknown collection for businessType:', businessType);
          if (mounted) setData(null);
          return;
        }
        const snap = await getDoc(doc(db, collectionName, businessId));
        if (!mounted) return;

        if (snap.exists()) {
          const raw = snap.data() as any;
          const normalized = normalizeBusinessDoc(snap.id, businessType, raw);
          setData(normalized);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error('BusinessAboutSection load error:', e);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [businessId, collectionName, businessType]);

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

  const phoneHref = data.phone ? `tel:${formatPhone(data.phone)}` : '';
  const mapsHref = buildGoogleMapsUrl({
    mapUrl: data.mapUrl,
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
          <InfoRow icon={<MapPin className="size-3.5" />} label={t('business_about.address')} value={data.displayAddress} />
        )}
        {data.phone && (
          <InfoRow icon={<Phone className="size-3.5" />} label={t('business_about.phone')} value={data.phone} href={phoneHref} />
        )}
        {data.email && (
          <InfoRow icon={<Mail className="size-3.5" />} label={t('business_about.email')} value={data.email} href={`mailto:${data.email}`} />
        )}
        {data.website && (
          <InfoRow icon={<Globe className="size-3.5" />} label={t('business_about.website')} value={normalizeUrl(data.website)} href={normalizeUrl(data.website)} external />
        )}
        {data.openingHours && (
          <InfoRow icon={<Clock className="size-3.5" />} label={t('business_about.opening_hours')} value={data.openingHours} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        {phoneHref && (
          <Button className="w-full sm:w-auto" onClick={() => { window.location.href = phoneHref; }}>
            {t('business_about.call_now')}
          </Button>
        )}

        {mapsHref && (
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => { window.open(mapsHref, '_blank', 'noopener,noreferrer'); }}>
            {t('business_about.get_directions')}
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

/* ============== Row / Social ============== */

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
  return `https://${url}`;
}

function formatPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

function buildGoogleMapsUrl(b: {
  mapUrl?: string;
  mapAddress?: string;
  location?: unknown;
}): string {
  try {
    if (isUrl(b.mapUrl)) return b.mapUrl!;
    if (isUrl(b.mapAddress)) return b.mapAddress!;

    if (typeof b.mapAddress === 'string' && b.mapAddress.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapAddress.trim())}`;
    }

    const loc = b.location as
      | string
      | { lat?: number | string; lng?: number | string; latitude?: number | string; longitude?: number | string }
      | [number | string, number | string]
      | undefined;

    if (typeof loc === 'string') {
      const nums = loc.match(/-?\d+(\.\d+)?/g);
      if (nums && nums.length >= 2) {
        const [lat, lng] = nums;
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    if (Array.isArray(loc) && loc.length >= 2) {
      const [lat, lng] = loc;
      if (lat != null && lng != null) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    if (loc && typeof loc === 'object') {
      // @ts-ignore
      const lat = (loc.lat ?? loc.latitude) as number | string | undefined;
      // @ts-ignore
      const lng = (loc.lng ?? loc.longitude) as number | string | undefined;
      if (lat != null && lng != null) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    return '';
  } catch {
    return '';
  }
}

/* ============== Normalizer ============== */

/**
 * Chuẩn hoá document từ các collection khác nhau về BaseBusiness.
 * - Với `private_provider`, mapAddress/address nằm trong `location.*`
 * - Nếu có `location.geo` → convert thành {lat,lng} cho mở map.
 */
function normalizeBusinessDoc(
  id: string,
  type: BusinessType,
  raw: any
): BaseBusiness {
  // Giá trị mặc định
  const base: BaseBusiness = {
    id,
    name: raw?.name || '—',
    email: raw?.email || undefined,
    phone: raw?.phone || undefined,
    displayAddress: raw?.displayAddress || undefined,
    mapAddress: raw?.mapAddress || undefined, // nhiều collection cũ đặt top-level
    mapUrl: raw?.mapUrl || undefined,
    location: raw?.location, // sẽ tinh chỉnh bên dưới
    website: raw?.website || undefined,
    openingHours: raw?.openingHours || undefined,
    description: raw?.description || undefined,
    socials: raw?.socials || undefined,
  };

  // Nếu là schema chuẩn mới (LocationCore)
  const loc = raw?.location;
  if (loc && typeof loc === 'object') {
    // Ưu tiên address/mapAddress bên trong location nếu có
    base.mapAddress = base.mapAddress ?? loc.mapAddress ?? loc.address ?? undefined;

    // Nếu có GeoPoint → chuyển thành {lat,lng}
    const gp = loc.geo;
    if (gp && typeof gp === 'object' && 'latitude' in gp && 'longitude' in gp) {
      base.location = {
        // @ts-ignore
        lat: gp.latitude,
        // @ts-ignore
        lng: gp.longitude,
      };
    } else if (typeof loc.location === 'string') {
      base.location = loc.location;
    }
    // Display address fallback
    if (!base.displayAddress && typeof loc.address === 'string') {
      base.displayAddress = loc.address;
    }
  }

  // Một số collection có thể lưu toạ độ thành mảng/obj khác → giữ nguyên,
  // buildGoogleMapsUrl sẽ lo phần còn lại.

  return base;
}
