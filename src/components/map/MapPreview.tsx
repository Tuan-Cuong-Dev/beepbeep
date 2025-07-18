// Dùng để các thành phần bất kì có thể gọi khi cần

'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  coords: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

const defaultIcon = new L.Icon({
    iconUrl: '/assets/images/technician.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

export default function MapPreview({ coords, zoom = 15 }: Props) {
  if (!coords.lat || !coords.lng) return null;

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coords.lat, coords.lng]} icon={defaultIcon} />
    </MapContainer>
  );
}
