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
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col h-full hover:shadow-xl transition-all">
      {/* ✅ Hàng đầu tiên: icon và tên */}
      <div className="flex items-center gap-3 mb-2">
        {/* Icon chiếm 1/3 */}
        <div className="w-1/3 flex justify-center">
          <img
            src="/assets/images/batterystation_new.png"
            alt="Battery Icon"
            className="w-10 h-10"
          />
        </div>

        {/* Tên + loại chiếm 2/3 */}
        <div className="w-2/3">
          <h3 className="text-base font-semibold text-gray-800 leading-tight">{name}</h3>
          <p className="text-sm text-gray-500 leading-tight">
            {vehicleType === 'car' ? 'Car' : 'Motorbike'} Station
          </p>
        </div>
      </div>

      {/* 📍 Địa chỉ */}
      <div className="flex items-start text-xs text-gray-500 gap-1">
        <MapPin className="w-4 h-4 mt-0.5" />
        <span>{displayAddress}</span>
      </div>

      {/* 📏 Khoảng cách */}
      {distanceText && (
        <p className="text-xs text-green-700 mt-1">📍 {distanceText}</p>
      )}

      {/* ⚡ Ghi chú cuối */}
      <div className="mt-auto text-xs text-gray-400 pt-2 flex items-center gap-1">
        <Zap className="w-4 h-4" />
        <span>Battery Station</span>
      </div>
    </div>
  );
}
