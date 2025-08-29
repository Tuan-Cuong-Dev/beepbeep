import React from 'react';
import { distanceKm, getEffectiveStatus, isValidLatLng } from '../utils/geo';


export function OpenIssuesLayer({ Marker, Popup, pulseIcon, openIssuePoints, showNearestMobiles, liveMobiles, t }: any) {
if (!openIssuePoints?.length || !pulseIcon) return null;
return (
<>
{openIssuePoints.map(({ issue, coord }: any) => {
const eff = getEffectiveStatus(issue);
if (!isValidLatLng(coord.lat, coord.lng)) return null;
const nearestMobileKmForIssue = showNearestMobiles && liveMobiles?.length
? Math.min(...liveMobiles.map((m: any) => distanceKm(coord, { lat: m.lat, lng: m.lng })))
: null;
return (
<Marker key={`open-${issue.id}-${coord.lat}-${coord.lng}`} position={[coord.lat, coord.lng]} icon={pulseIcon}>
<Popup>
<div className="text-sm">
<div className="font-semibold">{(issue as any).customerName || '—'} — <span className="capitalize">{t(`status.${eff}`)}</span></div>
{nearestMobileKmForIssue != null && (
<div className="text-xs mt-1">{t('distance_km', { val: nearestMobileKmForIssue.toFixed(2) })}</div>
)}
{(issue as any).phone && (
<div className="text-xs text-gray-600">{t('phone_short')}: {(issue as any).phone}</div>
)}
{(issue as any).location?.issueAddress && (
<div className="text-xs mt-1">{(issue as any).location.issueAddress}</div>
)}
<div className="mt-1 font-mono text-[11px]">{coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}</div>
<a className="text-blue-600 underline text-xs" href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`} target="_blank" rel="noopener noreferrer">{t('open_on_maps')}</a>
</div>
</Popup>
</Marker>
);
})}
</>
);
}