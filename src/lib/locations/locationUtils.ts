// 04/09/2025 Chuẩn hóa đối tượng cần tạo về vị trí theo chuẩn locationCore
// Đã áp dụng vào việc tạo vị trí của người dùng trong CreatBusinessForm

import { GeoPoint, serverTimestamp } from "firebase/firestore";
import type { LocationCore } from "./locationTypes";

export type Coords = { lat: number; lng: number };

export function parseLatLng(s?: string): Coords | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function buildLocationCore(params: {
  coords?: Coords | null;
  latLngString?: string;
  mapAddress?: string;
  address?: string;
}): LocationCore {
  const c = params.coords ?? parseLatLng(params.latLngString || "");
  if (!c) throw new Error("Invalid coordinates");
  return {
    geo: new GeoPoint(c.lat, c.lng),
    location: `${c.lat},${c.lng}`,
    mapAddress: params.mapAddress || undefined,
    address: params.address || undefined,
    updatedAt: serverTimestamp(),
  };
}
