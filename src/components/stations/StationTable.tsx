'use client';

import { useMemo } from 'react';
import { Station } from '@/src/lib/stations/stationTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  stations: Station[];
  onEdit: (station: Station) => void;
  onDelete: (stationId: string) => void;
  userLocation?: [number, number]; // ✅ Thêm vị trí người dùng
}

export default function StationTable({ stations, onEdit, onDelete, userLocation }: Props) {
  const extractLatLng = (location: string): [number, number] | null => {
    const match = location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
    if (!match) return null;
    return [parseFloat(match[1]), parseFloat(match[3])];
  };

  const getDistanceFromLatLng = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedStations = useMemo(() => {
    if (!userLocation) return stations;

    const [userLat, userLng] = userLocation;

    return [...stations].sort((a, b) => {
      const coordsA = extractLatLng(a.location) || [0, 0];
      const coordsB = extractLatLng(b.location) || [0, 0];
      const distA = getDistanceFromLatLng(userLat, userLng, coordsA[0], coordsA[1]);
      const distB = getDistanceFromLatLng(userLat, userLng, coordsB[0], coordsB[1]);
      return distA - distB;
    });
  }, [stations, userLocation]);

  const renderStatus = (status?: string) => {
    switch (status) {
      case 'inactive':
        return <span className="text-red-600">🚫 Inactive</span>;
      case 'maintenance':
        return <span className="text-yellow-600">🛠️ Maintenance</span>;
      default:
        return <span className="text-green-600">✅ Active</span>;
    }
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Address</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Map</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedStations.map((station) => {
            const coords = extractLatLng(station.location);
            return (
              <tr key={station.id} className="border-t align-top">
                <td className="p-2 font-medium text-gray-800">{station.name}</td>
                <td className="p-2 text-gray-600 whitespace-pre-wrap">{station.displayAddress}</td>
                <td className="p-2 text-gray-600">
                  {station.contactPhone || <span className="text-gray-400 italic">N/A</span>}
                </td>
                <td className="p-2">{renderStatus(station.status)}</td>
                <td className="p-2">
                  {coords ? (
                    <iframe
                      title={`Map-${station.id}`}
                      src={`https://www.google.com/maps?q=${coords[0]},${coords[1]}&hl=vi&z=15&output=embed`}
                      width="200"
                      height="100"
                      style={{ border: 0 }}
                      className="rounded-lg shadow"
                      loading="lazy"
                    />
                  ) : (
                    <p className="text-gray-400 italic">No map</p>
                  )}
                </td>
                <td className="p-2 text-right space-x-2 whitespace-nowrap">
                  <Button variant="outline" onClick={() => onEdit(station)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => onDelete(station.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
