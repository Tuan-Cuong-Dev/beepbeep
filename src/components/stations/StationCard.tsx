'use client';

import { Station } from '@/src/lib/stations/stationTypes';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';

interface Props {
  station: Station;
}

export default function StationCard({ station }: Props) {
  const { name, displayAddress, status, mapAddress, contactPhone } = station;

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }[status || 'inactive'];

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
