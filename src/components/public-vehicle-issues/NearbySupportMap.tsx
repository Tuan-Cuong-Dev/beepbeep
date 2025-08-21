'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
// ⛳️ Import động các component Leaflet để tránh SSR ("window is not defined")
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = () => {
  // Trì hoãn import hook đến client
  const m = require('react-leaflet');
  return m.useMap() as ReturnType<typeof m.useMap>;
};

import 'leaflet/dist/leaflet.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

type LatLng = { lat: number; lng: number };

interface NearbySupportMapProps {
  /** Tọa độ của khách hàng báo lỗi */
  issueCoords?: LatLng | null;
  /** Số lượng shop và mobile muốn hiển thị, mặc định 5 */
  limitPerType?: number;
}

/** ✅ Chuẩn hoá mọi kiểu toạ độ thành {lat,lng} hoặc null */
function normalizeCoords(coords: any): LatLng | null {
  if (!coords) return null;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (typeof coords === 'string' && coords.includes(',')) {
    const [latStr, lngStr] = coords.split(',').map((s: string) => s.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

/** Haversine (km) */
function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function FitToMarkers({ center, others }: { center?: LatLng; others: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    const pts = [...others];
    if (center) pts.push(center);
    if (!pts.length) return;
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const southWest = [Math.min(...lats), Math.min(...lngs)] as [number, number];
    const northEast = [Math.max(...lats), Math.max(...lngs)] as [number, number];
    map.fitBounds([southWest, northEast], { padding: [40, 40] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, others.map((p) => `${p.lat},${p.lng}`).join('|')]);

  return null;
}

export default function NearbySupportMap({ issueCoords, limitPerType = 5 }: NearbySupportMapProps) {
  const [shops, setShops] = useState<TechnicianPartner[]>([]);
  const [mobiles, setMobiles] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Chỉ render Map trên client để tránh "window is not defined"
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Tải partner: isActive = true, tách 2 loại
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const shopsQ = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true),
          where('type', '==', 'shop')
        );
        const mobilesQ = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true),
          where('type', '==', 'mobile')
        );

        const [shopsSnap, mobilesSnap] = await Promise.all([getDocs(shopsQ), getDocs(mobilesQ)]);
        if (!mounted) return;

        const parse = (d: any): TechnicianPartner => ({ id: d.id, ...d.data() });
        setShops(shopsSnap.docs.map(parse));
        setMobiles(mobilesSnap.docs.map(parse));
      } catch (e) {
        console.error('Load partners failed', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const topShops = useMemo(() => {
    if (!issueCoords) return [];
    return shops
      .map((p) => ({ p, coord: normalizeCoords(p.coordinates) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [shops, issueCoords, limitPerType]);

  const topMobiles = useMemo(() => {
    if (!issueCoords) return [];
    return mobiles
      .map((p) => ({ p, coord: normalizeCoords(p.coordinates) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [mobiles, issueCoords, limitPerType]);

  const otherPoints: LatLng[] = useMemo(() => {
    return [
      ...topShops.map((x) => x.coord),
      ...topMobiles.map((x) => x.coord),
    ];
  }, [topShops, topMobiles]);

  if (!issueCoords) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">
          Không có tọa độ của khách hàng để hiển thị bản đồ.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">Bản đồ hỗ trợ gần khách hàng</div>
        {loading && <div className="text-xs text-gray-500">Đang tải đối tác…</div>}
      </div>

      <div className="h-[420px] w-full">
        {/* Chỉ render MapContainer trên client */}
        {isClient && (
          <MapContainer
            center={[issueCoords.lat, issueCoords.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Fit viewport */}
            <FitToMarkers center={issueCoords} others={otherPoints} />

            {/* Marker vị trí khách hàng (màu thương hiệu #00d289) */}
            <CircleMarker
              center={[issueCoords.lat, issueCoords.lng]}
              radius={10}
              pathOptions={{ color: '#00d289', weight: 2, fillOpacity: 0.5 }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">Khách hàng báo lỗi</div>
                  <div className="mt-1 font-mono text-xs">
                    {issueCoords.lat.toFixed(6)}, {issueCoords.lng.toFixed(6)}
                  </div>
                  <a
                    className="text-blue-600 underline text-xs"
                    href={`https://www.google.com/maps/search/?api=1&query=${issueCoords.lat},${issueCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mở trên Google Maps
                  </a>
                </div>
              </Popup>
            </CircleMarker>

            {/* 5 cửa hàng sửa xe gần nhất (xanh dương) */}
            {topShops.map(({ p, coord, d }) => (
              <CircleMarker
                key={`shop-${p.id}`}
                center={[coord.lat, coord.lng]}
                radius={8}
                pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.5 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.shopName || p.name || 'Cửa hàng sửa xe'}</div>
                    {p.phone && (
                      <div className="text-xs mt-1">
                        ĐT: <a className="underline" href={`tel:${p.phone}`}>{p.phone}</a>
                      </div>
                    )}
                    {p.shopAddress && <div className="text-xs mt-1">{p.shopAddress}</div>}
                    <div className="text-xs mt-1">Khoảng cách: {d.toFixed(2)} km</div>
                    <a
                      className="text-blue-600 underline text-xs mt-1 inline-block"
                      href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mở trên Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 5 kỹ thuật viên lưu động gần nhất (cam) */}
            {topMobiles.map(({ p, coord, d }) => (
              <CircleMarker
                key={`mobile-${p.id}`}
                center={[coord.lat, coord.lng]}
                radius={8}
                pathOptions={{ color: '#f59e0b', weight: 2, fillOpacity: 0.5 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.name || 'Kỹ thuật viên lưu động'}</div>
                    {p.phone && (
                      <div className="text-xs mt-1">
                        ĐT: <a className="underline" href={`tel:${p.phone}`}>{p.phone}</a>
                      </div>
                    )}
                    {p.mapAddress && <div className="text-xs mt-1">{p.mapAddress}</div>}
                    <div className="text-xs mt-1">Khoảng cách: {d.toFixed(2)} km</div>
                    <a
                      className="text-blue-600 underline text-xs mt-1 inline-block"
                      href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mở trên Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#00d289' }} />
          Khách hàng
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2563eb' }} />
          Cửa hàng gần nhất
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          KTV lưu động gần nhất
        </div>
      </div>
    </div>
  );
}
