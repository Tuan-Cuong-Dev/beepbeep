'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';

interface Props {
  stations: BatteryChargingStation[];
}

export default function BatteryChargingStationMap({ stations }: Props) {
  return (
    <MapContainer center={[16.0471, 108.2062]} zoom={13} className="h-[400px] w-full rounded-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stations.map((station) => (
        station.coordinates && (
          <Marker
            key={station.id}
            position={[station.coordinates.lat, station.coordinates.lng]}
          >
            <Popup>
              <strong>{station.name}</strong>
              <br />
              {station.displayAddress}
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
