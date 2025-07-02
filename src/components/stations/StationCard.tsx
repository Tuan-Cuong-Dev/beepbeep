'use client';

import Image from 'next/image';
import { Station } from '@/src/lib/stations/stationTypes';
import { MapPin, Phone } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface Props {
  station: Station;
  userLocation?: [number, number]; // [latitude, longitude]
}

export default function StationCard({ station, userLocation }: Props) {
  const { name, displayAddress, status, mapAddress, contactPhone } = station;

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }[status || 'inactive'];

  // 🔎 Parse tọa độ từ station.location
  const match = station.location?.match(
    /([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i
  );
  const stationCoords = match ? [parseFloat(match[1]), parseFloat(match[3])] : null;

  // 📍 Hàm tính khoảng cách Haversine
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const distance =
    userLocation && stationCoords
      ? haversineDistance(userLocation[0], userLocation[1], stationCoords[0], stationCoords[1])
      : null;

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition duration-200 overflow-hidden border">
      <div className="relative h-32 w-full">
        <Image
          src="/assets/images/station-marker.png"
          alt="Station"
          fill
          className="object-contain p-6"
        />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 truncate">{name}</h3>
          <Badge className={statusColor}>{status}</Badge>
        </div>

        <div className="flex items-center text-sm text-gray-600 gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{displayAddress}</span>
        </div>

        {contactPhone && (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="truncate">{contactPhone}</span>
          </div>
        )}

        {distance !== null && (
          <p className="text-xs text-gray-500 italic">
            📍 {distance.toFixed(2)} km from you
          </p>
        )}

        {mapAddress && (
          <a
            href={mapAddress}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View on Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
