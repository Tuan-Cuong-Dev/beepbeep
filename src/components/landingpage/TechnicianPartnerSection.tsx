'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation'; // vẫn dùng hook hiện tại của bạn
import { useTranslation } from 'react-i18next';

import TechnicianPartnerCard from '@/src/components/techinicianPartner/TechnicianPartnerCard';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

// ===== Helpers chuẩn hoá toạ độ =====
type LatLng = { lat: number; lng: number };

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

// Hỗ trợ "16.0226,108.1207" hoặc "16.0226° N, 108.1207° E"
function parseLocationString(input?: string): LatLng | null {
  if (!input || typeof input !== 'string') return null;

  // ưu tiên "lat,lng"
  const comma = input.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (comma) {
    return { lat: parseFloat(comma[1]), lng: parseFloat(comma[3]) };
  }

  // hỗ trợ "lat° N, lng° E"
  const dms = input.match(
    /(-?\d+(\.\d+)?)°?\s*[NnSs]?,?\s*(-?\d+(\.\d+)?)°?\s*[EeWw]?/
  );
  if (dms) {
    return { lat: parseFloat(dms[1]), lng: parseFloat(dms[3]) };
  }
  return null;
}

/**
 * Chuẩn hoá LocationCore bất kỳ:
 * - { geo: GeoPoint }
 * - { lat, lng }
 * - { location: "lat,lng" }
 * - trực tiếp GeoPoint / {lat,lng} / "lat,lng"
 */
function extractLatLngFromLocationCore(loc: any): LatLng | null {
  if (!loc) return null;

  // GeoPoint trực tiếp
  if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
    return { lat: loc.latitude, lng: loc.longitude };
  }

  // { geo: GeoPoint }
  if (loc.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }

  // { lat, lng }
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }

  // { location: "lat,lng" }
  if (typeof loc.location === 'string') {
    const p = parseLocationString(loc.location);
    if (p) return p;
  }

  // string "lat,lng"
  if (typeof loc === 'string') {
    const p = parseLocationString(loc);
    if (p) return p;
  }

  return null;
}

// Chuẩn hoá userLocation từ hook hiện tại của bạn (có thể trả [lat,lng] hoặc object)
function normalizeUserLocation(userLocation: any): LatLng | null {
  if (!userLocation) return null;

  // [lat, lng]
  if (Array.isArray(userLocation) && userLocation.length === 2) {
    const [lat, lng] = userLocation;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  }

  // { lat, lng }
  if (typeof userLocation === 'object' && userLocation.lat && userLocation.lng) {
    return { lat: userLocation.lat, lng: userLocation.lng };
  }

  // { geo: GeoPoint }
  if (
    typeof userLocation?.geo?.latitude === 'number' &&
    typeof userLocation?.geo?.longitude === 'number'
  ) {
    return { lat: userLocation.geo.latitude, lng: userLocation.geo.longitude };
  }

  // { location: "lat,lng" }
  if (typeof userLocation?.location === 'string') {
    const p = parseLocationString(userLocation.location);
    if (p) return p;
  }

  // trực tiếp GeoPoint
  if (
    typeof userLocation?.latitude === 'number' &&
    typeof userLocation?.longitude === 'number'
  ) {
    return { lat: userLocation.latitude, lng: userLocation.longitude };
  }

  return null;
}

// ===== Component =====
export default function TechnicianPartnerSection() {
  const { t } = useTranslation();
  const { partners, loading } = usePublicTechnicianPartners(); // đảm bảo hook trả về partner.location chuẩn
  const { location: rawUserLocation } = useCurrentLocation();
  const userLatLng = useMemo(() => normalizeUserLocation(rawUserLocation), [rawUserLocation]);

  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  // Tổng số technician đang hoạt động
  const totalActive = useMemo(
    () => partners.filter((p) => p.isActive).length,
    [partners]
  );

  // Top 10 technician gần nhất
  const previewPartners = useMemo(() => {
    if (!partners.length) return [];

    // Nếu chưa có toạ độ người dùng thì cứ lấy 10 đối tác đầu
    if (!userLatLng) return partners.slice(0, 10);

    return [...partners]
      .sort((a, b) => {
        const A = extractLatLngFromLocationCore(a.location);
        const B = extractLatLngFromLocationCore(b.location);

        // Đưa những đối tác không có toạ độ xuống cuối
        if (!A && !B) return 0;
        if (!A) return 1;
        if (!B) return -1;

        const distA = getDistanceKm(userLatLng, A);
        const distB = getDistanceKm(userLatLng, B);
        return distA - distB;
      })
      .slice(0, 10);
  }, [partners, userLatLng]);

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {!loading && (
          <div className="text-center pt-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              <span className="sm:text-2xl md:text-3xl font-extrabold">
                {t('technicianSection.vehicle_trouble')}
              </span>
              <br />
              <span className="sm:text-lg md:text-xl text-gray-700">
                {t('technicianSection.call_technician_with_count', { count: totalActive })}
              </span>
            </h2>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="flex gap-4 w-max pb-2">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : previewPartners.slice(0, 6).map((partner) => (
                  <div key={partner.id} className="min-w-[260px] max-w-[260px] flex-shrink-0">
                    <TechnicianPartnerCard
                      partner={partner}
                      // truyền userLocation đã chuẩn hoá; card có thể dùng để hiển thị khoảng cách
                      userLocation={userLatLng}
                      onContact={() => setShowNotice(true)}
                    />
                  </div>
                ))}

            {!loading && (
              <div
                onClick={() => router.push('/technician-partners')}
                className="min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer"
              >
                <div className="border rounded-xl shadow bg-white h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('technicianSection.view_all')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('technicianSection.see_all_technicians')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title={t('technicianSection.notification_title')}
        description={t('technicianSection.notification_description')}
      />
    </section>
  );
}
