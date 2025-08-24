'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';

const TechnicianPartnerMap = dynamic(
  () => import('@/src/components/techinicianPartner/TechnicianPartnerMap'),
  { ssr: false }
);

// ========== Helpers chuẩn hoá & khoảng cách ==========
type LatLng = { lat: number; lng: number };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// "16.0226,108.1207" | "16.0226° N, 108.1207° E"
function parseLocationString(s?: string): LatLng | null {
  if (!s) return null;
  const m1 = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[3]) };

  const m2 = s.match(/(-?\d+(\.\d+)?)°?\s*[NnSs]?,?\s*(-?\d+(\.\d+)?)°?\s*[EeWw]?/);
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[3]) };

  return null;
}

/** Đọc đủ biến thể LocationCore: GeoPoint, {lat,lng}, {geo}, {location:"lat,lng"}, string */
function extractLatLngFromLocationCore(loc: any): LatLng | null {
  if (!loc) return null;

  // GeoPoint trực tiếp
  if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') {
    return { lat: loc.latitude, lng: loc.longitude };
  }
  // { geo: GeoPoint }
  if (typeof loc?.geo?.latitude === 'number' && typeof loc?.geo?.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  // { lat, lng }
  if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  // { location: "lat,lng" }
  if (typeof loc?.location === 'string') {
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

/** Chuẩn hoá userLocation từ hook hiện tại: [lat,lng] | {lat,lng} | {geo} | GeoPoint | {location:"lat,lng"} */
function normalizeUserLocation(u: any): LatLng | null {
  if (!u) return null;

  if (Array.isArray(u) && u.length === 2 && typeof u[0] === 'number' && typeof u[1] === 'number') {
    return { lat: u[0], lng: u[1] };
  }
  if (typeof u?.lat === 'number' && typeof u?.lng === 'number') {
    return { lat: u.lat, lng: u.lng };
  }
  if (typeof u?.geo?.latitude === 'number' && typeof u?.geo?.longitude === 'number') {
    return { lat: u.geo.latitude, lng: u.geo.longitude };
  }
  if (typeof u?.latitude === 'number' && typeof u?.longitude === 'number') {
    return { lat: u.latitude, lng: u.longitude };
  }
  if (typeof u?.location === 'string') {
    return parseLocationString(u.location);
  }
  return null;
}

export default function TechnicianPartnerPage() {
  const { partners } = useTechnicianPartners();
  const { location: rawUserLocation } = useCurrentLocation();
  const userLatLng = useMemo(() => normalizeUserLocation(rawUserLocation), [rawUserLocation]);

  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Lọc và sắp xếp đối tác kỹ thuật theo chuẩn mới (dùng partner.location)
  const sortedPartners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = partners.filter((p) => {
      const byName = p.name?.toLowerCase().includes(term);
      const byRegion = p.assignedRegions?.some((r) => r.toLowerCase().includes(term));
      return term ? (byName || byRegion) : true;
    });

    if (!userLatLng) return filtered;

    return [...filtered].sort((a, b) => {
      const A = extractLatLngFromLocationCore(a.location);
      const B = extractLatLngFromLocationCore(b.location);

      // Không có toạ độ → xuống cuối
      if (!A && !B) return 0;
      if (!A) return 1;
      if (!B) return -1;

      const distA = getDistanceKm(userLatLng.lat, userLatLng.lng, A.lat, A.lng);
      const distB = getDistanceKm(userLatLng.lat, userLatLng.lng, B.lat, B.lng);
      return distA - distB;
    });
  }, [partners, searchTerm, userLatLng]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />
      <main className="flex-1">
        <div className="relative h-[85vh] overflow-hidden rounded-lg">
          {/* 🔍 Thanh tìm kiếm nổi */}
          <div className="absolute z-[1000] top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 w-[98%] md:w-1/3 px-12">
            <Input
              placeholder="🔍 Search by name or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-lg"
            />
          </div>

          {/* 🗺️ Bản đồ hiển thị đối tác */}
          <TechnicianPartnerMap
            partners={sortedPartners}
            // vẫn truyền userLocation thô để tương thích component map hiện có
            userLocation={rawUserLocation}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
