"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  GeoPoint,
} from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";

/* ===========================
 * Helpers: geo & parsing
 * =========================== */

/** Parse "lat,lng" → [lat, lng] | null */
function parseLatLngString(s?: string): [number, number] | null {
  if (!s) return null;
  const parts = s.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/** Haversine distance (km) */
function distanceKm(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Bounding box cho bán kính r (km) quanh [lat,lng] */
function bboxFromCenter([lat, lng]: [number, number], radiusKm: number) {
  const dLat = radiusKm / 110.574; // ~km/deg
  const dLng = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  };
}

/** Đảm bảo location.geo tồn tại dựa vào location.location (string) nếu thiếu */
function ensureGeo(data: Partial<PrivateProvider>): Partial<PrivateProvider> {
  const loc: any = data.location ?? {};
  if (!loc.geo && loc.location) {
    const parsed = parseLatLngString(loc.location);
    if (parsed) {
      loc.geo = new GeoPoint(parsed[0], parsed[1]);
    }
  }
  return { ...data, location: loc };
}

/* ===========================
 * Types cho hook
 * =========================== */

export type CreatePrivateProviderInput = Omit<
  PrivateProvider,
  "id" | "createdAt" | "updatedAt" | "businessType"
> & {
  // Cho phép thiếu geo khi submit, sẽ tự suy ra từ location.location
  location: PrivateProvider["location"];
};

type NearbyParams = {
  center: [number, number]; // [lat, lng]
  radiusKm: number; // bán kính tìm kiếm
  ownerId?: string; // optional filter
  take?: number; // giới hạn kết quả sau khi lọc (client-side)
};

type UsePrivateProvidersOptions = {
  ownerId?: string; // lọc theo owner
  realtime?: boolean; // bật realtime onSnapshot
  pageSize?: number; // giới hạn ban đầu
};

/* ===========================
 * Hook chính
 * =========================== */

export function usePrivateProviders(options: UsePrivateProvidersOptions = {}) {
  const { ownerId, realtime = false, pageSize = 200 } = options;

  const [providers, setProviders] = useState<PrivateProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null); // ✅ cần initial value

  /* -------- Fetch (one-shot hoặc realtime) -------- */
  const buildBaseQuery = () => {
    const col = collection(db, "privateProviders");
    const wheres: any[] = [];
    if (ownerId) wheres.push(where("ownerId", "==", ownerId));
    // Có thể bổ sung orderBy nếu bạn muốn sắp theo tên (yêu cầu index nếu kết hợp where)
    return query(col, ...wheres, orderBy("createdAt", "desc"), fsLimit(pageSize));
  };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const q = buildBaseQuery();
    const snap = await getDocs(q);
    const rows = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as PrivateProvider)
    );
    setProviders(rows);
    setLoading(false);
  }, [ownerId, pageSize]);

  useEffect(() => {
    if (!realtime) {
      fetchProviders();
      return;
    }
    const q = buildBaseQuery();
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PrivateProvider)
      );
      setProviders(rows);
    });
    unsubRef.current = unsub;
    return () => unsubRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, realtime, pageSize]);

  /* -------- CRUD -------- */

  const addProvider = useCallback(
    async (input: CreatePrivateProviderInput) => {
      const data = ensureGeo({
        ...input,
        businessType: "private_provider",
        createdAt: serverTimestamp(), // ✅ FieldValue (không ép về Timestamp)
      }) as any;

      await addDoc(collection(db, "privateProviders"), data);
      if (!realtime) await fetchProviders();
    },
    [fetchProviders, realtime]
  );

  const updateProvider = useCallback(
    async (id: string, patch: Partial<PrivateProvider>) => {
      const data = ensureGeo({
        ...patch,
        updatedAt: serverTimestamp(), // ✅ FieldValue
      }) as any;

      await updateDoc(doc(db, "privateProviders", id), data);
      if (!realtime) await fetchProviders();
    },
    [fetchProviders, realtime]
  );

  const deleteProvider = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, "privateProviders", id));
      if (!realtime) await fetchProviders();
    },
    [fetchProviders, realtime]
  );

  /* -------- Nearby search (client-friendly) -------- */
  const findNearby = useCallback(
    async ({ center, radiusKm, ownerId, take }: NearbyParams) => {
      const [lat, lng] = center;
      const { minLat, maxLat, minLng, maxLng } = bboxFromCenter(center, radiusKm);

      // 1) Query bounding box
      const col = collection(db, "privateProviders");
      const clauses: any[] = [
        where("location.geo", ">=", new GeoPoint(minLat, minLng)),
        where("location.geo", "<=", new GeoPoint(maxLat, maxLng)),
      ];
      if (ownerId) clauses.push(where("ownerId", "==", ownerId));

      const q = query(col, ...clauses, fsLimit(500));
      const snap = await getDocs(q);
      const candidates = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PrivateProvider)
      );

      // 2) Lọc lại đúng bán kính bằng Haversine
      const filtered = candidates
        .map((p) => {
          const gp = p.location?.geo;
          if (!gp) return { p, dist: Number.POSITIVE_INFINITY };
          const d = distanceKm([gp.latitude, gp.longitude], [lat, lng]);
          return { p, dist: d };
        })
        .filter((x) => x.dist <= radiusKm)
        .sort((a, b) => a.dist - b.dist)
        .map((x) => x.p);

      return take ? filtered.slice(0, take) : filtered;
    },
    []
  );

  /* -------- Derived: map-friendly list -------- */
  const mapPoints = useMemo(
    () =>
      providers
        .filter((p) => p.location?.geo)
        .map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.location.geo.latitude,
          lng: p.location.geo.longitude,
          address: p.displayAddress,
          link: p.location.mapAddress,
        })),
    [providers]
  );

  return {
    providers,
    loading,

    fetchProviders,
    addProvider,
    updateProvider,
    deleteProvider,

    findNearby, // tìm theo bán kính (km)
    mapPoints,  // tiện cho marker trên bản đồ
  };
}
