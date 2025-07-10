'use client';

import { Station } from '@/src/lib/stations/stationTypes';
import Image from 'next/image';
import { MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface Props {
  station: Station;
  userLocation?: [number, number];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export default function StationCard({ station, userLocation }: Props) {
  const { name, displayAddress, status, mapAddress, contactPhone, geo } = station;

  const statusColor = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }[status || 'inactive'];

  const distanceText =
    geo && userLocation
      ? `${haversineDistance(userLocation[0], userLocation[1], geo.lat, geo.lng).toFixed(1)} km away`
      : '';

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col h-full hover:shadow-xl transition-all">
      {/* Top: Icon + Name + Status */}
      <div className="flex items-start gap-3 mb-2 w-full">
        {/* Icon */}
        <div className="w-1/3 flex justify-center items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden border border-gray-300">
            <Image
              src="/assets/images/stationmarker.png"
              alt="Station Icon"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
        </div>
        {/* Name + Status */}
        <div className="w-2/3">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">{name}</h3>
          <Badge className={`text-xs rounded-full mt-1 px-2 py-0.5 ${statusColor}`}>
            {status}
          </Badge>
        </div>
      </div>

      {/* Info content */}
      <div className="flex flex-col h-full">
        {/* Address */}
        <div className="flex items-start text-sm text-gray-600 gap-2 w-full">
          <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
          <span className="leading-tight">{displayAddress}</span>
        </div>

        {/* Phone */}
        {contactPhone && (
          <div className="flex items-center text-sm text-gray-600 gap-2 mt-1">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{contactPhone}</span>
          </div>
        )}

        {/* Distance */}
        {distanceText && (
          <p className="text-xs text-gray-500 mt-1">📍 {distanceText}</p>
        )}

        {/* Map link luôn nằm cuối cùng */}
        {mapAddress && (
          <div className="mt-auto pt-3">
            <a
              href={mapAddress}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#00d289] font-medium inline-flex items-center gap-1 hover:underline"
            >
              View on map <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
