'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRentalData } from '@/src/hooks/useRentalData';

const stationIcon = new L.Icon({
  iconUrl: '/assets/images/station-marker.png',
  iconSize: [24, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function StationMarkers({ visible = true }: { visible?: boolean }) {
  const { rentalStations } = useRentalData();
  console.log('📍 StationMarkers render', rentalStations.length);

  if (!visible) return null;

  const parseLatLng = (location: string): [number, number] | null => {
    const parts = location?.split(',');
    if (parts.length !== 2) return null;

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
  };

  return (
    <>
      {rentalStations
        .map((station) => {
          const coords = parseLatLng(station.location);
          if (!coords) return null;

          return (
            <Marker key={station.id} position={coords} icon={stationIcon}>
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
        })
        .filter(Boolean)}
    </>
  );
}
