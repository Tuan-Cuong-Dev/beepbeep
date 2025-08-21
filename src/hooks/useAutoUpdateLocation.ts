// Cập nhật vị trí cho các đối tượng thường xuyên di chuyển

// hooks/useAutoUpdateLocation.ts
'use client';

import { useEffect, useRef } from 'react';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { updateUserLiveLocation } from '@/src/lib/live-location/updateUserLiveLocation';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

type UseAutoUpdateLocationOpts = {
  enabled: boolean;             // chỉ bật khi user là đối tượng di chuyển
  uid?: string | null;
  displayName?: string | null;
  businessType?: BusinessType | null;
  companyId?: string | null;
  entityId?: string | null;
  ttlMinutes?: number;          // mặc định 15
  watch?: boolean;              // mặc định false: chỉ cập nhật khi vào web / khi tab active lại
};

export function useAutoUpdateLocation(opts: UseAutoUpdateLocationOpts) {
  const {
    enabled,
    uid,
    displayName,
    businessType,
    companyId,
    entityId,
    ttlMinutes = 15,
    watch = false,
  } = opts;

  const { location, error } = useCurrentLocation();
  const lastSent = useRef<string>(''); // hash để tránh spam cùng 1 toạ độ

  // helper tạo "hash" đơn giản từ lat/lng (đủ để giảm spam)
  const hashCoords = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

  // 1) Cập nhật ngay khi có toạ độ lần đầu
  useEffect(() => {
    if (!enabled || !uid || !businessType) return;
    if (!location) return;
    const [lat, lng] = location;
    const key = hashCoords(lat, lng);
    if (lastSent.current === key) return;

    lastSent.current = key;
    updateUserLiveLocation({
      uid,
      displayName: displayName ?? null,
      businessType,
      companyId: companyId ?? null,
      entityId: entityId ?? null,
      coords: { lat, lng },
      ttlMinutes,
      // accuracy/heading/speed: getCurrentPosition() không trả về ở hook này,
      // nếu cần, chuyển sang navigator.geolocation.watchPosition để lấy đủ.
    }).catch(() => {
      // nuốt lỗi nhẹ — có thể log Sentry nếu muốn
    });
  }, [enabled, uid, businessType, companyId, entityId, ttlMinutes, displayName, location]);

  // 2) Re-check khi tab quay lại foreground hoặc khi online trở lại
  useEffect(() => {
    if (!enabled || !uid || !businessType) return;

    const onVisibleOrOnline = () => {
      // Gọi lại geolocation nhanh — tận dụng hook useCurrentLocation (lần tới render sẽ cập nhật)
      // Ở đây chỉ cần reset "lastSent" để cho phép gửi lại nếu coords giống
      lastSent.current = '';
      // Nếu muốn chắc ăn, có thể gọi navigator.geolocation.getCurrentPosition ở đây.
    };

    document.addEventListener('visibilitychange', onVisibleOrOnline);
    window.addEventListener('online', onVisibleOrOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibleOrOnline);
      window.removeEventListener('online', onVisibleOrOnline);
    };
  }, [enabled, uid, businessType]);

  // 3) Tuỳ chọn: theo dõi liên tục (watchPosition)
  useEffect(() => {
    if (!enabled || !uid || !businessType) return;
    if (!watch || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const key = hashCoords(latitude, longitude);
        if (lastSent.current === key) return;

        lastSent.current = key;
        updateUserLiveLocation({
          uid,
          displayName: displayName ?? null,
          businessType,
          companyId: companyId ?? null,
          entityId: entityId ?? null,
          coords: { lat: latitude, lng: longitude },
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          ttlMinutes,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 }
    );

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {}
    };
  }, [enabled, uid, businessType, companyId, entityId, ttlMinutes, displayName, watch]);
}
