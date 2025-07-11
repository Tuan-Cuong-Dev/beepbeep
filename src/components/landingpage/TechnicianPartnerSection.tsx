'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import TechnicianPartnerCard from '@/src/components/techinicianPartner/TechnicianPartnerCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

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

function parseCoords(geo?: string | { lat: number; lng: number }): [number, number] {
  if (!geo) return [0, 0];
  if (typeof geo === 'object' && 'lat' in geo && 'lng' in geo) return [geo.lat, geo.lng];

  const match = geo.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
  if (!match) return [0, 0];
  return [parseFloat(match[1]), parseFloat(match[3])];
}

export default function TechnicianPartnerSection() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);
  const { location: userLocation } = useCurrentLocation();
  const router = useRouter();

  const sortedPartners = useMemo(() => {
    if (!userLocation || !Array.isArray(userLocation)) return partners;
    const [userLat, userLng] = userLocation;

    return [...partners].sort((a, b) => {
      const [latA, lngA] = parseCoords(a.geo);
      const [latB, lngB] = parseCoords(b.geo);
      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);
      return distA - distB;
    });
  }, [partners, userLocation]);

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center pt-6">
          <span className="sm:text-2xl md:text-3xl font-extrabold">
            Vehicle trouble?
          </span>
          <br />
          <span className="sm:text-lg md:text-xl text-gray-700">
            Call to a technician!
          </span>
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading technician partners...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {sortedPartners.slice(0, 6).map((partner) => (
                  <div
                    key={partner.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <TechnicianPartnerCard
                      partner={partner}
                      onContact={() => setShowNotice(true)}
                      userLocation={userLocation}
                    />
                  </div>
                ))}

                {/* ✅ Card cuối: View All */}
                <div
                  onClick={() => router.push('/technician-partners')}
                  className="min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer"
                >
                  <div className="border rounded-xl shadow bg-white h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition">
                    <h3 className="text-lg font-semibold text-gray-800">View All</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      See all technicians near you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title="📞 Contact Technician"
        description="We are building a contact system so you can reach technicians directly. Coming soon!"
      />
    </section>
  );
}
