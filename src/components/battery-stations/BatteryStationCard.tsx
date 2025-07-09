'use client';

import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { MapPin, Zap } from 'lucide-react';

interface Props {
  station: BatteryStation;
    userLocation?: [number, number] | null;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BatteryStationCard({ station, userLocation }: Props) {
  const { name, displayAddress, vehicleType, coordinates } = station;

  let distanceText = '';
  if (userLocation && coordinates) {
    const dist = getDistanceKm(
      userLocation[0],
      userLocation[1],
      coordinates.lat,
      coordinates.lng
    );
    distanceText = `${Math.round(dist * 10) / 10} km away`;
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-start h-full hover:shadow-xl transition-all">
      <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
      <p className="text-sm text-gray-600 mt-1">{vehicleType === 'car' ? 'Car' : 'Motorbike'} Station</p>

      <div className="mt-2 flex items-center text-xs text-gray-500 gap-1">
        <MapPin className="w-4 h-4" />
        <span>{displayAddress}</span>
      </div>

      {distanceText && (
        <p className="text-xs text-green-700 mt-1">📍 {distanceText}</p>
      )}

      <div className="mt-auto text-xs text-gray-400 pt-2 flex items-center gap-1">
        <Zap className="w-4 h-4" />
        <span>Battery Station</span>
      </div>
    </div>
  );
}
