// @/src/components/map/NearbySupportMap/index.tsx
'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';

import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTechnicianPresence, useTrackPolyline } from '@/src/hooks/useLiveTechnicians';

// ✅ helpers
import {
  toNum, isValidLatLng, sanitizeLatLng, parseLatLngString,
  extractLatLngFromLocationCore, extractLatLngFromIssueLocation,
  distanceKm, getEffectiveStatus,
} from './utils/geo';
import { FitToMarkers, InvalidateOnMount, InvalidateOnToggle } from './utils/fit';
import { useContainerReady } from './hooks/useContainerReady';
import { useSafeCenter } from './hooks/useSafeCenter';
import { DEFAULT_CENTER, DEFAULT_ZOOM, STATUS_COLOR as statusColor } from './utils/constants';

// ✅ layers (đúng đường dẫn bạn đang dùng)
import { FocusIssueLayer } from './layers/FocusIssueLayer';
import { OpenIssuesLayer } from './layers/OpenIssuesLayer';
import { ShopsLayer } from './layers/ShopsLayer';
import { MobilesLayer } from './layers/MobilesLayer';
import { TrackPolylineLayer } from './layers/TrackPolylineLayer';
import { Legend } from './layers/Legend';

// ✅ react-leaflet: chỉ MapContainer/TileLayer dùng dynamic; các lớp con nhận qua props
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Circle        = dynamic(() => import('react-leaflet').then(m => m.Circle),        { ssr: false });
const Polyline      = dynamic(() => import('react-leaflet').then(m => m.Polyline),      { ssr: false });


// 🕵️ DEV LOG: in ra mọi lần Leaflet nhận LatLng không hợp lệ (kèm stack)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const L = require('leaflet');

  if (!L.__latlngPatched) {
    const _origFactory = L.latLng.bind(L);
    L.latLng = (...args: any[]) => {
      const [a, b] = args;
      const la = Number(typeof a === 'object' ? a?.lat : a);
      const ln = Number(typeof a === 'object' ? a?.lng ?? a?.lon : b);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        // highlight lỗi + call stack
        // eslint-disable-next-line no-console
        console.error('[Leaflet DEBUG] Invalid L.latLng', { a, b, la, ln });
        // eslint-disable-next-line no-console
        console.trace();
      }
      return _origFactory(...args);
    };

    const _OrigCtor = L.LatLng;
    // @ts-ignore
    L.LatLng = function (this: any, lat: any, lng: any, alt?: any) {
      const la = Number(lat), ln = Number(lng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        // eslint-disable-next-line no-console
        console.error('[Leaflet DEBUG] Invalid new L.LatLng', { lat, lng, la, ln });
        // eslint-disable-next-line no-console
        console.trace();
      }
      // @ts-ignore
      return new _OrigCtor(lat, lng, alt);
    };
    // @ts-ignore
    L.LatLng.prototype = _OrigCtor.prototype;
    // @ts-ignore
    L.__latlngPatched = true; // tránh patch 2 lần khi HMR
  }
}
