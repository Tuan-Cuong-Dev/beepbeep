'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 👇 Dùng icon Leaflet mặc định từ CDN (không cần copy file về /public)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  lat?: number;
  lng?: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const defaultPosition = { lat: 16.0471, lng: 108.2062 }; // Da Nang

function LocationMarker({
  position,
  onChange,
}: {
  position: { lat: number; lng: number };
  onChange: (p: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return <Marker position={position} />;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const initial = lat && lng ? { lat, lng } : defaultPosition;
  const [position, setPosition] = useState(initial);

  useEffect(() => {
    if (lat && lng) setPosition({ lat, lng });
  }, [lat, lng]);

  const handleChange = (coords: { lat: number; lng: number }) => {
    setPosition(coords);
    onChange(coords);
  };

  return (
    <div className="rounded border overflow-hidden h-[300px]">
      <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onChange={handleChange} />
      </MapContainer>
    </div>
  );
}
