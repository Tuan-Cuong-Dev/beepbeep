import React from 'react';


export function TrackPolylineLayer({ Polyline, showTrack, poly }: any) {
if (!showTrack || !poly || poly.length <= 1) return null;
return (
<>
{Array.from({ length: poly.length - 1 }).map((_, i) => {
const a = poly[i], b = poly[i + 1];
const valid = [a,b].every((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng));
if (!valid) return null;
const opacity = 0.2 + 0.8 * ((i + 1) / poly.length);
return (
<Polyline key={`seg-${i + 1}`} positions={[[a.lat, a.lng],[b.lat, b.lng]]} pathOptions={{ color: '#111827', weight: 3, opacity }} />
);
})}
</>
);
}