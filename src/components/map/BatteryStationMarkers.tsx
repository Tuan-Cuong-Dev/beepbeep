'use client';

import { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike';
  /** ✅ Thêm prefix để đảm bảo key duy nhất tuyệt đối giữa các layer */
  keyPrefix?: string;
}

const batteryIcon = L.icon({
  iconUrl: '/assets/images/batterystation_new.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function isValidLatLng(lat: any, lng: any): boolean {
  return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
}

/** ✅ Khử trùng lặp theo id (phòng trường hợp gộp nhiều nguồn về sau) */
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

export default function BatteryStationMarkers({
  vehicleType,
  keyPrefix = 'battery',
}: Props) {
  const [stations, setStations] = useState<BatteryStation[]>([]);

  useEffect(() => {
    if (vehicleType === 'bike') {
      setStations([]);
      return;
    }

    let isMounted = true;

    const fetchBatteryStations = async () => {
      try {
        const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as BatteryStation)
        );
        if (isMounted) setStations(data);
      } catch (error) {
        console.error('Error fetching battery stations:', error);
      }
    };

    fetchBatteryStations();
    return () => {
      isMounted = false;
    };
  }, [vehicleType]);

  /** ✅ Lọc theo loại xe + loại bỏ item không hợp lệ + khử trùng lặp */
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
          key={`${keyPrefix}:${station.id}`} 
          position={[station.coordinates!.lat, station.coordinates!.lng]}
          icon={batteryIcon}
        >
          <Popup>
            <strong>{station.name}</strong>
            <br />
            {station.displayAddress}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
