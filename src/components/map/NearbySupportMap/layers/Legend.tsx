import React from 'react';


export function Legend({ isFullscreen, t, statusColor }: any) {
if (isFullscreen) return null;
const statuses: string[] = ['pending','assigned','proposed','confirmed','rejected','in_progress'];
return (
<div className="flex flex-wrap items-center gap-4 p-3 text-xs text-gray-600">
<div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#f59e0b' }} />{t('legend.viewing_issue')}</div>
{statuses.map((st) => (
<div className="flex items-center gap-2" key={st}><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusColor[st] }} />{t(`status.${st}`)}</div>
))}
<div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2563eb' }} />{t('legend.nearest_shop')}</div>
<div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#00d289' }} />{t('legend.nearest_mobile')}</div>
</div>
);
}