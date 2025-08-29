import React from 'react';


export function FocusIssueLayer({
Marker, Popup, pulseIcon,
safeIssue,
nearestMobileKm,
focusedIssue,
t,
}: any) {
if (!safeIssue || !pulseIcon) return null;
return (
<Marker position={[safeIssue.lat, safeIssue.lng]} icon={pulseIcon}>
<Popup>
<div className="text-sm">
<div className="font-semibold">{t('focus_issue')}</div>
{nearestMobileKm != null && (
<div className="text-xs mt-1">{t('distance_km', { val: nearestMobileKm.toFixed(2) })}</div>
)}
{focusedIssue?.phone && (
<div className="text-xs text-gray-600 mt-1">
{t('phone_short')}: <a className="underline" href={`tel:${(focusedIssue as any).phone}`}>{(focusedIssue as any).phone}</a>
</div>
)}
{focusedIssue?.location?.issueAddress && (
<div className="text-xs mt-1">{(focusedIssue as any).location.issueAddress}</div>
)}
<div className="mt-1 font-mono text-xs">{safeIssue.lat.toFixed(6)}, {safeIssue.lng.toFixed(6)}</div>
<a className="text-blue-600 underline text-xs"
href={`https://www.google.com/maps/search/?api=1&query=${safeIssue.lat},${safeIssue.lng}`}
target="_blank" rel="noopener noreferrer">
{t('open_on_maps')}
</a>
</div>
</Popup>
</Marker>
);
}