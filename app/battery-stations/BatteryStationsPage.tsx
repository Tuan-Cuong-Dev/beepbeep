'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import BatteryStationMap from '@/src/components/battery-stations/BatteryStationMap';
import BatteryStationCard from '@/src/components/battery-stations/BatteryStationCard';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function BatteryStationsPage() {
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  // 📍 Lấy vị trí người dùng
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('⚠️ Error getting location:', err.message)
      );
    }
  }, []);

  // 🔄 Fetch battery stations
  useEffect(() => {
    const fetchStations = async () => {
      const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        ...(doc.data() as BatteryStation),
        id: doc.id,
      }));
      setStations(data);
      setLoading(false);
    };

    fetchStations();
  }, []);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 pb-10">
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="flex justify-center items-center gap-2 mb-6">
          <img
            src="/assets/images/batterystation_new.png"
            alt="Battery Station Icon"
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Battery Swap Stations
          </h1>
        </div>


          {loading ? (
            <p className="text-center text-gray-500">Loading stations...</p>
          ) : stations.length === 0 ? (
            <p className="text-center text-gray-500">No battery stations found.</p>
          ) : (
            <>
              {/* 🗺️ Map view */}
              <BatteryStationMap stations={stations} />

              {/* 📋 Card list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {stations.map((station) => (
                  <BatteryStationCard
                    key={station.id}
                    station={station}
                    userLocation={userLocation}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
