'use client';

import { useEffect, useState } from 'react';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { Marker, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';

const technicianIcon = L.icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 38],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function TechnicianMarkers() {
  const { partners } = usePublicTechnicianPartners();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <LayerGroup>
      {partners
        .filter((p) => p.coordinates && !isNaN(p.coordinates.lat) && !isNaN(p.coordinates.lng))
        .map((p) => (
          <Marker
            key={p.id}
            position={[p.coordinates?.lat??0, p.coordinates?.lng??0]}
            icon={technicianIcon}
          >
            <Popup>
              <div className="text-sm leading-snug max-w-[220px]">
                <p className="font-semibold text-black">{p.name}</p>
                <p className="text-gray-700 text-xs mb-1">
                  {p.type === 'shop' ? 'Shop Technician' : 'Mobile Technician'}
                </p>
                <p className="text-gray-600 text-xs">📍 {p.shopAddress || 'No address'}</p>
                <p className="text-gray-600 text-xs mb-1">📞 {p.phone || 'No phone'}</p>
                {p.phone && (
                  <a
                    href={`tel:${p.phone}`}
                    className="inline-block text-xs text-white bg-green-500 px-3 py-1 rounded mt-1 hover:bg-green-600"
                  >
                    📞 Call Now
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </LayerGroup>
  );
}
