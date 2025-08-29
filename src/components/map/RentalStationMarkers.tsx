'use client';

import { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station } from '@/src/lib/stations/stationTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // Optional for 'all'
  /** ✅ Namespace để key luôn duy nhất giữa các layer */
  keyPrefix?: string;
}

// Icon for rental station marker
const rentalStationIcon = L.icon({
  iconUrl: '/assets/images/stationmarker.png',
  iconSize: [25, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Parse "15.8785655° N, 108.3258334° E" to [15.8785655, 108.3258334]
function parseLocationString(locationStr: string): [number, number] | null {
  try {
    const [latPart, lngPart] = locationStr.split(',');
    const lat = parseFloat(String(latPart).trim());
    const lng = parseFloat(String(lngPart).trim());
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return [lat, lng];
  } catch {
    console.warn('❌ Error parsing location string:', locationStr);
    return null;
  }
}

function isMatchingType(station: Station, vehicleType?: string) {
  return !vehicleType || !station.vehicleType || station.vehicleType === vehicleType;
}

/** ✅ Khử trùng lặp theo id (phòng trường hợp sau này gộp nhiều nguồn) */
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

export default function RentalStationMarkers({
  vehicleType,
  keyPrefix = 'rental',
}: Props) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchStations = async () => {
      try {
        const snap = await getDocs(collection(db, 'rentalStations'));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Station, 'id'>),
        }));
        if (isMounted) setStations(data);
      } catch (err) {
        console.error('Error loading rental stations:', err);
      }
    };

    fetchStations();
    return () => {
      isMounted = false;
    };
  }, []);

  /** ✅ Lọc đúng loại + valid tọa độ + khử trùng lặp */
  const data = useMemo(() => {
    const filtered = (stations || []).filter((station) => {
      if (!isMatchingType(station, vehicleType)) return false;
      const coords =
        typeof station.location === 'string'
          ? parseLocationString(station.location)
          : null;
      return !!coords;
    });
    return uniqById(filtered);
  }, [stations, vehicleType]);

  return (
    <>
      {data.map((station) => {
        const coords = parseLocationString(station.location as unknown as string);
        if (!coords) return null;
        const [lat, lng] = coords;

        return (
          <Marker
            key={`${keyPrefix}:${station.id}`} // ✅ key có namespace
            position={[lat, lng]}
            icon={rentalStationIcon}
          >
            <Popup>
              <strong>{station.name}</strong>
              <br />
              {station.displayAddress}
              {station.contactPhone && (
                <>
                  <br />
                  📞 {station.contactPhone}
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
