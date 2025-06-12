'use client';

import { Station } from '@/src/lib/stations/stationTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  stations: Station[];
  onEdit: (station: Station) => void;
  onDelete: (stationId: string) => void;
}

export default function StationTable({ stations, onEdit, onDelete }: Props) {
  const extractLatLng = (location: string): { lat: string; lng: string } | null => {
    const match = location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
    if (!match) return null;
    return { lat: match[1], lng: match[3] };
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Address</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Map</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => {
            const coords = extractLatLng(station.location);
            return (
              <tr key={station.id} className="border-t align-top">
                <td className="p-2 font-medium">{station.name}</td>
                <td className="p-2 text-gray-700">{station.displayAddress}</td>
                <td className="p-2">
                  {station.status === 'inactive' ? (
                    <span className="text-red-600">🚫 Inactive</span>
                  ) : (
                    <span className="text-green-600">✅ Active</span>
                  )}
                </td>
                <td className="p-2">
                  {coords ? (
                    <iframe
                      title={`Map-${station.id}`}
                      src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=15&output=embed`}
                      width="200"
                      height="100"
                      style={{ border: 0 }}
                      className="rounded-lg shadow"
                      loading="lazy"
                    ></iframe>
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
