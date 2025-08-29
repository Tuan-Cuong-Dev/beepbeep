'use client';

import { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike';
  /** ✅ thêm prefix để đảm bảo key là duy nhất */
  keyPrefix?: string;
}

const chargingIcon = L.icon({
  iconUrl: '/assets/images/BatteryChargingStation.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function isValidLatLng(lat: any, lng: any): boolean {
  return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
}

/** ✅ khử trùng lặp theo id (phòng trường hợp load từ nhiều nguồn về sau) */
function uniqById<T extends { id?: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (!x?.id) continue;
    if (!seen.has(x.id)) {
      seen.add(x.id);
      out.push(x);
    }
  }
  return out;
}

export default function BatteryChargingStationMarkers({
  vehicleType,
  keyPrefix = 'charging',
}: Props) {
  const { t } = useTranslation();
  const [stations, setStations] = useState<BatteryChargingStation[]>([]);

  useEffect(() => {
    // Không hiển thị với xe đạp
    if (vehicleType === 'bike') {
      setStations([]);
      return;
    }

    let isMounted = true;

    const fetchChargingStations = async () => {
      try {
        const q = query(collection(db, 'batteryChargingStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as BatteryChargingStation)
        );
        if (isMounted) setStations(data);
      } catch (error) {
        console.error('Error fetching battery charging stations:', error);
      }
    };

    fetchChargingStations();
    return () => {
      isMounted = false;
    };
  }, [vehicleType]);

  /** ✅ filter theo loại xe + loại bỏ item không hợp lệ + khử trùng lặp */
  const data = useMemo(() => {
    const filtered = (stations || []).filter((station) => {
      const isMatchingType =
        !vehicleType || !station.vehicleType || station.vehicleType === vehicleType;
      const coords = station.coordinates;
      return isMatchingType && coords && isValidLatLng(coords.lat, coords.lng);
    });
    return uniqById(filtered);
  }, [stations, vehicleType]);

  return (
    <>
      {data.map((station) => (
        <Marker
          key={`${keyPrefix}:${station.id}`} // ✅ key duy nhất tuyệt đối theo namespace
          position={[station.coordinates!.lat, station.coordinates!.lng]}
          icon={chargingIcon}
        >
          <Popup>
            <div className="text-sm max-w-[220px]">
              <p className="font-semibold text-black">{station.name}</p>
              <p className="text-xs text-gray-600">{station.displayAddress}</p>
              {station.phone && <p className="text-xs text-blue-600">📞 {station.phone}</p>}
              {station.description && (
                <p className="text-xs mt-1 text-gray-700">{station.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
