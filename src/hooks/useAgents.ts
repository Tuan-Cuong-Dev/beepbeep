// Update 04/09/2025

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc, getDocs, limit as fsLimit, onSnapshot,
  orderBy, query, serverTimestamp, Timestamp, updateDoc, where, GeoPoint
} from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import type { Agent } from "@/src/lib/agents/agentTypes";

/* Helpers */
function parseLatLngString(s?: string): [number, number] | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}
function ensureGeo<T extends Partial<Agent>>(data: T): T {
  const loc: any = data.location ?? {};
  if (!loc.geo && loc.location) {
    const p = parseLatLngString(loc.location);
    if (p) loc.geo = new GeoPoint(p[0], p[1]);
  }
  return { ...data, location: loc } as T;
}

type UseAgentsOptions = {
  ownerId?: string;
  realtime?: boolean;
  pageSize?: number;
};

export function useAgents({ ownerId, realtime = false, pageSize = 200 }: UseAgentsOptions = {}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const buildBaseQuery = () => {
    const col = collection(db, "agents");
    const wheres = ownerId ? [where("ownerId", "==", ownerId)] : [];
    return query(col, ...wheres, orderBy("createdAt", "desc"), fsLimit(pageSize));
  };

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(buildBaseQuery());
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Agent[];
    setAgents(rows);
    setLoading(false);
  }, [ownerId, pageSize]);

  useEffect(() => {
    if (!realtime) { fetchAgents(); return; }
    const unsub = onSnapshot(buildBaseQuery(), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Agent[];
      setAgents(rows);
    });
    unsubRef.current = unsub;
    return () => unsubRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, realtime, pageSize]);

  const addAgent = useCallback(async (payload: Omit<Agent, "id" | "createdAt" | "updatedAt">) => {
    const data = ensureGeo({
      ...payload,
      businessType: "agent",
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
    }) as any;
    await addDoc(collection(db, "agents"), data);
    if (!realtime) await fetchAgents();
  }, [fetchAgents, realtime]);

  const updateAgent = useCallback(async (id: string, patch: Partial<Agent>) => {
    const data = ensureGeo({ ...patch, updatedAt: serverTimestamp() }) as any;
    await updateDoc(doc(db, "agents", id), data);
    if (!realtime) await fetchAgents();
  }, [fetchAgents, realtime]);

  const deleteAgent = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "agents", id));
    if (!realtime) await fetchAgents();
  }, [fetchAgents, realtime]);

  const mapPoints = useMemo(() =>
    agents
      .filter(a => a.location?.geo)
      .map(a => ({
        id: a.id,
        name: a.name,
        lat: a.location.geo.latitude,
        lng: a.location.geo.longitude,
        address: a.displayAddress,
        link: a.location.mapAddress,
      })),
    [agents]
  );

  return { agents, loading, fetchAgents, addAgent, updateAgent, deleteAgent, mapPoints };
}
