// hooks/useTechnicianPartnerLiveLocation.ts
// Hook: chỉ dành cho TechnicianPartner (mobile)
// Hook này lấy toạ độ 1 lần khi vào dashboard và gọi writer ở trên.

'use client';

import { useEffect, useRef } from 'react';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { updateTechnicianPartnerLocation } from '@/src/lib/technicianPartners/updateLocation';

type Props = {
  enabled: boolean;                    // chỉ true khi type === 'mobile'
  technicianPartnerId?: string | null; // nếu có id thì nhanh hơn
  userId?: string | null;              // fallback khi chưa có id
};

export function useTechnicianPartnerLiveLocation({
  enabled,
  technicianPartnerId,
  userId,
}: Props) {
  const { location, error } = useCurrentLocation();
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled) {
      console.debug('[TP-LiveLocation] Disabled → skip update');
      return;
    }
    if (sent.current) {
      console.debug('[TP-LiveLocation] Already sent once → skip');
      return;
    }
    if (!location) {
      console.debug('[TP-LiveLocation] No location yet');
      return;
    }
    if (error) {
      console.warn('[TP-LiveLocation] Location error:', error);
      return;
    }

    const [lat, lng] = location;
    console.debug('[TP-LiveLocation] Got location →', { lat, lng, technicianPartnerId, userId });

    sent.current = true;

    updateTechnicianPartnerLocation({
      technicianPartnerId,
      userId,
      coords: { lat, lng },
      source: 'web',
    })
      .then(() => {
        console.debug('[TP-LiveLocation] Location updated successfully');
      })
      .catch((err) => {
        console.error('[TP-LiveLocation] Failed to update location:', err);
        // optionally gửi Sentry log
      });
  }, [enabled, location, error, technicianPartnerId, userId]);
}
