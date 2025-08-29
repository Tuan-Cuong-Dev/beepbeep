import type { LocationCore } from '@/src/lib/locations/locationTypes';
import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';


export function toNum(v: any): number {
if (typeof v === 'number') return v;
if (typeof v === 'string') { const n = parseFloat(v.trim()); return Number.isFinite(n) ? n : NaN; }
return NaN;
}
export function isValidLatLng(lat: any, lng: any): boolean {
const la = toNum(lat), ln = toNum(lng);
return Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
}
export function sanitizeLatLng<T extends { lat: any; lng: any }>(p?: T | null) {
if (!p) return null; const la = toNum(p.lat), ln = toNum(p.lng); return isValidLatLng(la, ln) ? { lat: la, lng: ln } : null;
}
export function parseLatLngString(s?: string) {
if (!s) return null; const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/); if (!m) return null;
return sanitizeLatLng({ lat: m[1], lng: m[3] });
}


export function extractLatLngFromLocationCore(loc?: LocationCore | null) {
if (!loc) return null;
if (typeof loc.geo?.latitude !== 'undefined' && typeof loc.geo?.longitude !== 'undefined') {
return sanitizeLatLng({ lat: loc.geo.latitude, lng: loc.geo.longitude });
}
return parseLatLngString((loc as any).location) ?? null;
}


export function extractLatLngFromIssueLocation(issue: PublicVehicleIssue) {
const loc: any = issue.location;
if (loc) {
if (typeof loc?.geo?.latitude !== 'undefined' && typeof loc?.geo?.longitude !== 'undefined') {
return sanitizeLatLng({ lat: loc.geo.latitude, lng: loc.geo.longitude });
}
const fromStr = parseLatLngString(loc.location || loc.coordinates);
if (fromStr) return fromStr;
}
if ((issue as any)?.location?.coordinates) {
const c: any = (issue as any).location.coordinates;
if (typeof c?.lat !== 'undefined' && typeof c?.lng !== 'undefined') return sanitizeLatLng({ lat: c.lat, lng: c.lng });
const fromStr = parseLatLngString(typeof c === 'string' ? c : undefined);
if (fromStr) return fromStr;
}
return null;
}


export function distanceKm(a: {lat:number; lng:number}, b: {lat:number; lng:number}) {
const R = 6371; const dLat = ((b.lat - a.lat) * Math.PI) / 180; const dLng = ((b.lng - a.lng) * Math.PI) / 180;
const lat1 = (a.lat * Math.PI) / 180; const lat2 = (b.lat * Math.PI) / 180;
const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); return R * c;
}


export function getEffectiveStatus(i: any) { return (i?.status === 'proposed' && i?.approveStatus === 'rejected') ? 'rejected' : i?.status; }