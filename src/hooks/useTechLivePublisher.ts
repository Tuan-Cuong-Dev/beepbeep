'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';

type Options = {
  techId: string;
  name?: string;
  companyName?: string;
  avatarUrl?: string | null;

  sessionId: string;
  enabled: boolean;
  presenceIntervalMs?: number; // tần suất cập nhật presence
  trackMinTimeMs?: number;     // khoảng thời gian tối thiểu giữa 2 điểm track
  trackMinDistanceM?: number;  // khoảng cách tối thiểu giữa 2 điểm track (m)
};

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(A));
}

export function useTechLivePublisher({
  techId,
  name,
  companyName,
  avatarUrl,
  sessionId,
  enabled,
  presenceIntervalMs = 10000,
  trackMinTimeMs = 15000,
  trackMinDistanceM = 20,
}: Options) {
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPresenceRef = useRef<number>(0);
  const lastTrackRef = useRef<{ t: number; lat: number; lng: number } | null>(null);
  const stillRef = useRef<{ since: number; lastSpd: number | null }>({ since: 0, lastSpd: null });
  const pageVisibleRef = useRef<boolean>(true);

  // ⏸ pause khi tab ẩn để tiết kiệm pin
  useEffect(() => {
    const onVis = () => { pageVisibleRef.current = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);
    onVis();
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!enabled || !techId || !sessionId) return;

    if (!('geolocation' in navigator)) {
      setError('Thiết bị không hỗ trợ định vị (geolocation).');
      return;
    }

    const onPos = async (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, heading, speed, accuracy } = pos.coords;
      const now = Date.now();

      // ---- Presence: cập nhật mỗi n giây ----
      if (now - lastPresenceRef.current >= presenceIntervalMs) {
        lastPresenceRef.current = now;
        try {
          await setDoc(
            doc(db, COLLECTIONS.presence, techId), // ✅ dùng key 'presence'
            {
              techId,
              type: 'mobile',
              status: 'online',
              sessionId,
              name: name ?? null,
              companyName: companyName ?? null,
              avatarUrl: avatarUrl ?? null,
              lastLocation: {
                geo: { latitude: lat, longitude: lng },
                address: null,
              },
              lat,
              lng,
              heading: heading ?? null,
              speed: speed ?? null,
              accuracy: accuracy ?? null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

        } catch (e: any) {
          console.error('presence setDoc error', e);
          setError(e?.message || 'Failed to update presence');
        }
      }

      // ---- Downsample track ----
      const s = typeof speed === 'number' ? speed : null;
      const last = lastTrackRef.current;

      if ((s ?? 0) < 1) {
        if (!stillRef.current.since) stillRef.current.since = now;
        if (now - stillRef.current.since > 60_000) return; // đứng yên > 60s => bỏ
      } else {
        stillRef.current.since = 0;
      }

      const byTime = !last || now - last.t >= trackMinTimeMs;
      const byDistance = !last || haversine({ lat: last.lat, lng: last.lng }, { lat, lng }) >= trackMinDistanceM;

      if (byTime && byDistance) {
        lastTrackRef.current = { t: now, lat, lng };
        try {
          await addDoc(collection(db, COLLECTIONS.points(techId, sessionId)), {
            t: new Date(now),
            lat,
            lng,
            speed: s ?? null,
            heading: heading ?? null,
            acc: accuracy ?? null,
          });
        } catch (e: any) {
          console.error('track addDoc error', e);
          setError(e?.message || 'Failed to add track point');
        }
      }
    };

    const onErr = (e: GeolocationPositionError) => setError(e.message);

    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [
    enabled,
    techId,
    sessionId,
    name,
    companyName,
    avatarUrl,
    presenceIntervalMs,
    trackMinTimeMs,
    trackMinDistanceM,
  ]);

  return { error };
}
