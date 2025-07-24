'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';

import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

const BatteryChargingStationMap = dynamic(() => import('./BatteryChargingStationMap'), {
  ssr: false,
});

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

export default function BatteryChargingStationsClientPage() {
  const { location: userLocation } = useCurrentLocation();
  const [stations, setStations] = useState<BatteryChargingStation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'batteryChargingStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => {
          const raw = doc.data();
          return {
            ...(raw as BatteryChargingStation),
            id: doc.id,
            coordinates: {
              lat: raw.coordinates?.lat ?? raw.coordinates?.latitude ?? 0,
              lng: raw.coordinates?.lng ?? raw.coordinates?.longitude ?? 0,
            },
          };
        });

        console.log('✅ Charging stations fetched:', data);
        setStations(data);
        setError(null);
      } catch (err: any) {
        console.error('❌ Error fetching stations:', err);
        setError('Failed to load stations.');
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const sortedStations = useMemo(() => {
    const filtered = stations.filter((station) => {
      const searchMatch =
        station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.displayAddress?.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });

    if (!userLocation || !Array.isArray(userLocation)) return filtered;

    const [userLat, userLng] = userLocation;

    return [...filtered].sort((a, b) => {
      const latA = a.coordinates?.lat ?? 0;
      const lngA = a.coordinates?.lng ?? 0;
      const latB = b.coordinates?.lat ?? 0;
      const lngB = b.coordinates?.lng ?? 0;

      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);

      return distA - distB;
    });
  }, [stations, searchTerm, userLocation]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <div className="relative h-[85vh] overflow-hidden rounded-lg">
          {/* Search bar over map */}
          <div className="absolute px-12 top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[1000] w-[95%] md:w-1/3">
            <Input
              placeholder="🔌 Search charging stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-lg"
            />
          </div>

          {/* Map with station markers */}
          {loading ? (
            <div className="flex items-center justify-center h-full bg-white bg-opacity-60">
              <p className="text-gray-600 text-sm">Loading stations...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-white bg-opacity-60">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : (
            <BatteryChargingStationMap stations={sortedStations} userLocation={userLocation ?? undefined} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
