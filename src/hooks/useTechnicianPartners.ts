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
type LegacyWorking = { isWorking?: boolean; startTime?: string; endTime?: string };
type LegacyPartner = TechnicianPartner & {
  // legacy slots that may still exist on historical docs:
  coordinates?: { lat?: number; lng?: number } | null;
  mapAddress?: string;
  geo?: { lat: number; lng: number };
  workingHours?: LegacyWorking[];
  workingStartTime?: string;
  workingEndTime?: string;
};

// ---- normalize legacy location → LocationCore ----
function toLocationCoreFromLegacy(raw: any): LocationCore | null {
  // 1) Nếu đã đúng chuẩn LocationCore + có geo (GeoPoint) -> dùng luôn
  const loc = raw?.location;
  if (loc?.geo instanceof GeoPoint) {
    // đảm bảo có location string (optional)
    const locationStr =
      typeof loc?.location === 'string' && loc.location.trim()
        ? loc.location
        : `${loc.geo.latitude},${loc.geo.longitude}`;
    return {
      geo: loc.geo,
      location: locationStr,
      mapAddress: loc?.mapAddress,
      address: loc?.address,
      updatedAt: loc?.updatedAt ?? raw?.updatedAt ?? serverTimestamp(),
    };
  }

  // 2) Legacy field ở root: geo {lat,lng} hoặc coordinates {lat,lng}
  const g = raw?.geo;
  const c = raw?.coordinates;
  const lat =
    typeof g?.lat === 'number'
      ? g.lat
      : typeof c?.lat === 'number'
      ? c.lat
      : undefined;
  const lng =
    typeof g?.lng === 'number'
      ? g.lng
      : typeof c?.lng === 'number'
      ? c.lng
      : undefined;

  if (typeof lat === 'number' && typeof lng === 'number') {
    const gp = new GeoPoint(lat, lng);
    return {
      geo: gp,
      location: `${lat},${lng}`,
      mapAddress: raw?.location?.mapAddress ?? raw?.mapAddress, // ưu tiên trong location nếu có
      address: raw?.location?.address ?? raw?.shopAddress ?? undefined,
      updatedAt: serverTimestamp(),
    };
  }

  // 3) Chưa có gì để build LocationCore
  return loc?.geo ? (loc as LocationCore) : null;
}

// ---- fallback giờ làm việc từ legacy workingHours nếu thiếu ----
function deriveWorkingTimes(raw: LegacyPartner) {
  const firstWorking = raw.workingHours?.find?.((d) => d?.isWorking);
  const workingStartTime = raw.workingStartTime ?? firstWorking?.startTime ?? '';
  const workingEndTime = raw.workingEndTime ?? firstWorking?.endTime ?? '';
  return { workingStartTime, workingEndTime };
}

// ---- Chuẩn hoá 1 record sang TechnicianPartner (schema mới) ----
function normalizePartner(docId: string, raw: LegacyPartner): TechnicianPartner {
  const { workingStartTime, workingEndTime } = deriveWorkingTimes(raw);

  // Bóc tách legacy keys để không trả về trong object cuối
  const {
    workingHours: _legacyWorkingHours,
    coordinates: _legacyCoordinates,
    mapAddress: _legacyMapAddress,
    geo: _legacyGeo,
    ...rest
  } = raw as any;

  // Chuẩn hoá LocationCore
  const normalizedLoc = toLocationCoreFromLegacy(raw);

  return {
    ...rest,
    id: docId,
    location: normalizedLoc ?? rest.location, // nếu null (hiếm), vẫn gán cái có sẵn để không crash UI
    workingStartTime,
    workingEndTime,
  } as TechnicianPartner;
}

export function useTechnicianPartners() {
  const { user } = useUser();
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'technicianPartners');
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as LegacyPartner;
        return normalizePartner(docSnap.id, raw);
      });
      setPartners(data);
    } catch (error) {
      console.error('❌ Failed to fetch technician partners:', error);
    } finally {
      setLoading(false);
    }
  };

  // API tạo user Firebase qua route riêng (giữ nguyên)
  const createFirebaseUser = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) => {
    const res = await fetch('/api/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!res.ok) {
      const errorMessage = isJson ? (await res.json()).error : await res.text();
      console.error('❌ API /createUser error:', errorMessage);
      throw new Error(errorMessage || 'Unknown error');
    }

    const data = isJson ? await res.json() : null;
    if (!data?.uid) throw new Error('Missing uid from response');
    return data.uid;
  };

  // ---- ADD ----
  const addPartner = async (
    partner: Partial<TechnicianPartner> & { email?: string; password?: string }
  ) => {
    try {
      if (!user?.uid) throw new Error('Missing creator userId');

      // Loại bỏ legacy nếu lỡ truyền từ UI cũ
      const {
        // legacy – sẽ bỏ qua
        coordinates: _legacyCoordinates,
        mapAddress: _legacyMapAddress,
        geo: _legacyGeo,
        workingHours: _legacyWorkingHours,
        // còn lại
        ...clean
      } = partner as any;

      // Bắt buộc phải có location.geo (chuẩn mới)
      if (!clean.location?.geo || !(clean.location.geo instanceof GeoPoint)) {
        throw new Error('Missing valid location.geo (GeoPoint) in payload');
      }

      const now = Timestamp.now();

      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...clean,
        userId: '',
        createdBy: user.uid,
        isActive: partner.isActive ?? true,
        avatarUrl: partner.avatarUrl || '/assets/images/technician.png',
        workingStartTime: partner.workingStartTime ?? '',
        workingEndTime: partner.workingEndTime ?? '',
        createdAt: now,
        updatedAt: now,
        // đảm bảo location.updatedAt
        'location.updatedAt': serverTimestamp(),
      });

      await fetchPartners();
      return newDoc.id;
    } catch (error) {
      console.error('❌ Failed to create technician partner:', error);
      throw error;
    }
  };

  // ---- UPDATE ----
  const updatePartner = async (
    id: string | undefined,
    updates: Partial<
      Omit<TechnicianPartner, 'createdAt' | 'createdBy' | 'id'> & {
        email: string;
        password: string;
      }
    >
  ) => {
    if (!id) {
      console.error('❌ Missing partner ID when updating');
      return;
    }

    try {
      const partnerRef = doc(db, 'technicianPartners', id);
      const partnerSnap = await getDoc(partnerRef);
      const existingPartner = partnerSnap.exists()
        ? (partnerSnap.data() as TechnicianPartner)
        : null;

      let userId = updates.userId || existingPartner?.userId;

      // Nếu chưa có userId mà form cung cấp email/password -> tạo Firebase user
      if (!userId && updates.email?.trim() && updates.password?.trim()) {
        try {
          userId = await createFirebaseUser({
            email: updates.email,
            password: updates.password,
            name: updates.name ?? existingPartner?.name ?? '',
          });

          if (!userId) {
            throw new Error('Missing userId when writing to Firestore');
          }

          await setDoc(
            doc(db, 'users', userId),
            {
              email: updates.email,
              name: updates.name ?? existingPartner?.name ?? '',
              role: 'technician_partner',
              createdAt: existingPartner?.createdAt || Timestamp.now(),
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );
        } catch (err: any) {
          if (typeof err?.message === 'string' && err.message.includes('email-already-in-use')) {
            alert('❌ Email đã được sử dụng cho tài khoản khác.');
          } else {
            alert('❌ Lỗi tạo tài khoản: ' + (err?.message || 'Unknown error'));
          }
          throw err;
        }
      }

      // Bỏ legacy keys nếu được truyền vào
      const {
        coordinates: _legacyCoordinates,
        mapAddress: _legacyMapAddress,
        geo: _legacyGeo,
        workingHours: _legacyWorkingHours,
        ...cleanUpdates
      } = updates as any;

      // Nếu có cập nhật location thì đảm bảo updatedAt
      const payload: any = {
        ...cleanUpdates,
        ...(userId ? { userId } : {}),
        isActive: updates.isActive ?? existingPartner?.isActive ?? true,
        avatarUrl:
          updates.avatarUrl || existingPartner?.avatarUrl || '/assets/images/technician.png',
        workingStartTime:
          updates.workingStartTime ?? existingPartner?.workingStartTime ?? '',
        workingEndTime:
          updates.workingEndTime ?? existingPartner?.workingEndTime ?? '',
        updatedAt: Timestamp.now(),
      };

      if (cleanUpdates.location) {
        payload['location.updatedAt'] = serverTimestamp();
      }

      await updateDoc(partnerRef, payload);

      console.log('✅ Partner updated successfully:', id);
      await fetchPartners();
    } catch (error) {
      console.error('❌ Failed to update technician partner:', error);
      throw error;
    }
  };

  // ---- DELETE ----
  const deletePartner = async (id: string, userId?: string) => {
    try {
      if (userId) {
        await setDoc(
          doc(db, 'users', userId),
          {
            role: 'customer',
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      }

      await deleteDoc(doc(db, 'technicianPartners', id));
      await fetchPartners();

      console.log('✅ Technician partner removed and user downgraded to customer.');
    } catch (error) {
      console.error('❌ Failed to remove partner or update user:', error);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    loading,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
  };
}
