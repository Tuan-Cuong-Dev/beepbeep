'use client';

import dynamic from 'next/dynamic';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { useState, useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';

const TechnicianPartnerMap = dynamic(
  () => import('@/src/components/techinicianPartner/TechnicianPartnerMap'),
  { ssr: false }
);

// ✅ Hàm tính khoảng cách giữa 2 điểm
function getDistanceFromLatLng(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ Parse geo string hoặc object
function parseCoords(geo?: string | { lat: number; lng: number }): [number, number] {
  if (!geo) return [0, 0];
  if (typeof geo === 'object') return [geo.lat, geo.lng];

  const match = geo.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
  if (!match) return [0, 0];
  return [parseFloat(match[1]), parseFloat(match[3])];
}

export default function TechnicianPartnerPage() {
  const { partners, loading } = usePublicTechnicianPartners();
  const { location: userLocation } = useCurrentLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const sortedPartners = useMemo(() => {
    const filtered = partners.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assignedRegions?.some((r) =>
          r.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    });

    if (!userLocation) return filtered;

    const [userLat, userLng] = userLocation;
    return [...filtered].sort((a, b) => {
      const [latA, lngA] = parseCoords(a.geo);
      const [latB, lngB] = parseCoords(b.geo);
      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);
      return distA - distB;
    });
  }, [partners, searchTerm, userLocation]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans ">
      <Header />
      <main className="flex-1 p-4">
        <div className="relative h-[85vh] overflow-hidden rounded-lg">
          {/* Thanh tìm kiếm nổi trên bản đồ */}
          <div className="absolute px-10 top-20 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[1000] w-[98%] md:w-1/3">
            <Input
              placeholder="🔍 Search by name or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-lg"
            />
          </div>

          {/* Bản đồ kỹ thuật viên */}
          <TechnicianPartnerMap partners={sortedPartners} userLocation={userLocation} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
