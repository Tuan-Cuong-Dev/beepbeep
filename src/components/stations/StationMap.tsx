'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '@/src/lib/stations/stationTypes';

const stationIcon = new L.Icon({
  iconUrl: '/assets/images/station-marker.png',
  iconSize: [25, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Props {
  stations: Station[];
}

export default function StationMap({ stations }: Props) {
  const center = stations.length > 0
    ? [stations[0].geo?.lat ?? 16.0471, stations[0].geo?.lng ?? 108.2062]
    : [16.0471, 108.2062]; // fallback Đà Nẵng

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden">
      <MapContainer center={center as [number, number]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {stations.map((station) =>
          station.geo?.lat != null && station.geo?.lng != null ? (
            <Marker
              key={station.id}
              position={[station.geo.lat, station.geo.lng]}
              icon={stationIcon}
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
          ) : null
        )}
      </MapContainer>
    </div>
  );
}
