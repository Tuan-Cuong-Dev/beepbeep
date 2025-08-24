// Đây là hooks xữ lý các đối tác kỹ thuật, Chứ ko phải là kỹ thuật viên của công ty
// Các kỹ thuật viên của công ty nằm ở collections "staffs" chứ ko phải "technicianPartner"

// 📁 hooks/useTechnicianPartners.ts
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  setDoc,
  getDoc,
  GeoPoint,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { useUser } from '@/src/context/AuthContext';

// ---- Legacy helpers ----
type LegacyPartner = Partial<TechnicianPartner> & {
  coordinates?: { lat?: number; lng?: number } | null;
  geo?: { lat: number; lng: number };
  mapAddress?: string;
  workingHours?: { isWorking?: boolean; startTime?: string; endTime?: string }[];
};

// ---- normalize legacy location → LocationCore ----
function toLocationCoreFromLegacy(raw: any): LocationCore | null {
  const loc = raw?.location;
  if (loc?.geo instanceof GeoPoint) {
    return {
      ...loc,
      location:
        typeof loc.location === 'string' && loc.location.trim()
          ? loc.location
          : `${loc.geo.latitude},${loc.geo.longitude}`,
      updatedAt: loc.updatedAt ?? raw?.updatedAt ?? serverTimestamp(),
    };
  }

  const lat =
    typeof raw?.geo?.lat === 'number'
      ? raw.geo.lat
      : typeof raw?.coordinates?.lat === 'number'
      ? raw.coordinates.lat
      : undefined;
  const lng =
    typeof raw?.geo?.lng === 'number'
      ? raw.geo.lng
      : typeof raw?.coordinates?.lng === 'number'
      ? raw.coordinates.lng
      : undefined;

  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      geo: new GeoPoint(lat, lng),
      location: `${lat},${lng}`,
      mapAddress: raw?.mapAddress,
      updatedAt: serverTimestamp(),
    };
  }
  return null;
}

// ---- Chuẩn hoá 1 record sang TechnicianPartner (schema mới) ----
function normalizePartner(docId: string, raw: LegacyPartner): TechnicianPartner {
  const { workingStartTime, workingEndTime } = raw;
  const normalizedLoc = toLocationCoreFromLegacy(raw);

  const {
    coordinates: _legacyCoordinates,
    geo: _legacyGeo,
    workingHours: _legacyWorkingHours,
    ...rest
  } = raw as any;

  return {
    ...rest,
    id: docId,
    location: normalizedLoc ?? (rest.location as LocationCore),
    workingStartTime: workingStartTime ?? '',
    workingEndTime: workingEndTime ?? '',
  } as TechnicianPartner;
}

// ---- HOOK chính ----
export function useTechnicianPartners() {
  const { user } = useUser();
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'technicianPartners'));
      const data = snapshot.docs.map((docSnap) =>
        normalizePartner(docSnap.id, docSnap.data() as LegacyPartner)
      );
      setPartners(data);
    } catch (err) {
      console.error('❌ Failed to fetch technician partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async (partner: Partial<TechnicianPartner>) => {
    if (!user?.uid) throw new Error('Missing creator userId');
    if (!partner.location?.geo) throw new Error('Missing location.geo');

    const now = Timestamp.now();
    const newDoc = await addDoc(collection(db, 'technicianPartners'), {
      ...partner,
      createdBy: user.uid,
      isActive: partner.isActive ?? true,
      avatarUrl: partner.avatarUrl || '/assets/images/technician.png',
      createdAt: now,
      updatedAt: now,
      'location.updatedAt': serverTimestamp(),
    });
    await fetchPartners();
    return newDoc.id;
  };

  const updatePartner = async (id: string, updates: Partial<TechnicianPartner>) => {
    if (!id) return;
    const ref = doc(db, 'technicianPartners', id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: Timestamp.now(),
      ...(updates.location ? { 'location.updatedAt': serverTimestamp() } : {}),
    });
    await fetchPartners();
  };

  const deletePartner = async (id: string) => {
    await deleteDoc(doc(db, 'technicianPartners', id));
    await fetchPartners();
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return { partners, loading, fetchPartners, addPartner, updatePartner, deletePartner };
}
