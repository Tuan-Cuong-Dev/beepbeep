import React from 'react';
import { isValidLatLng } from '../utils/geo';


export function ShopsLayer({ CircleMarker, Popup, showNearestShops, topShops, t }: any) {
if (!showNearestShops || !topShops?.length) return null;
return (
<>
{topShops.map(({ p, coord, d }: any) => {
if (!isValidLatLng(coord.lat, coord.lng)) return null;
return (
<CircleMarker key={`shop-${p.id}`} center={[coord.lat, coord.lng]} radius={12} pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.5 }}>
<Popup>
<div className="text-sm">
<div className="font-semibold">{(p as any).shopName || (p as any).name || t('shop_fallback')}</div>
{(p as any).phone && (
<div className="text-xs mt-1">{t('phone_short')}: <a className="underline" href={`tel:${(p as any).phone}`}>{(p as any).phone}</a></div>
)}
{(p as any).location?.address && <div className="text-xs mt-1">{(p as any).location.address}</div>}
<div className="text-xs mt-1">{t('distance_km', { val: d.toFixed(2) })}</div>
<a className="text-blue-600 underline text-xs mt-1 inline-block" href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`} target="_blank" rel="noopener noreferrer">{t('open_on_maps')}</a>
</div>
</Popup>
</CircleMarker>
);
})}
</>
);
}