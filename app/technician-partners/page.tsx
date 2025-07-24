'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';

const TechnicianPartnerMap = dynamic(
  () => import('@/src/components/techinicianPartner/TechnicianPartnerMap'),
  { ssr: false }
);

// 🔧 Tính khoảng cách giữa hai điểm
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // bán kính Trái Đất km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔧 Parse geo string hoặc object an toàn
function parseCoords(geo?: string | { lat: number; lng: number }): [number, number] {
  if (!geo) return [0, 0];

  if (typeof geo === 'object') {
    const lat = typeof geo.lat === 'number' ? geo.lat : 0;
    const lng = typeof geo.lng === 'number' ? geo.lng : 0;
    return [lat, lng];
  }

  const match = geo.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
  if (!match) return [0, 0];

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[3]);

  if (isNaN(lat) || isNaN(lng)) return [0, 0];
  return [lat, lng];
}

export default function TechnicianPartnerPage() {
  const { partners } = usePublicTechnicianPartners();
  const { location: userLocation } = useCurrentLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Lọc và sắp xếp đối tác kỹ thuật
  const sortedPartners = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();

    const filtered = partners.filter((p) =>
      p.name.toLowerCase().includes(lowerTerm) ||
      p.assignedRegions?.some((r) => r.toLowerCase().includes(lowerTerm))
    );

    if (!userLocation) return filtered;

    const [userLat, userLng] = userLocation;

    return [...filtered].sort((a, b) => {
      const [latA, lngA] = parseCoords(a.geo);
      const [latB, lngB] = parseCoords(b.geo);

      const distA = getDistanceKm(userLat, userLng, latA, lngA);
      const distB = getDistanceKm(userLat, userLng, latB, lngB);

      return distA - distB;
    });
  }, [partners, searchTerm, userLocation]);

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
            userLocation={userLocation}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
