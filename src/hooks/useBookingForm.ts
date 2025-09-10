// useBookingForm.ts
'use client';

import * as React from 'react';
import {
  Timestamp,
  collection,
  addDoc,
  getDocs,
  query,
  updateDoc,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { useRentalForm } from './useRentalForm';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { useUser } from '@/src/context/AuthContext';
import type { User } from '@/src/lib/users/userTypes';
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import type { Program } from '@/src/lib/programs/rental-programs/programsType';
import { useCommissionHistory, CommissionPolicy } from '@/src/hooks/useCommissionHistory';

/* ================= Helpers: Address / User ================= */

function addressCoreToString(addr?: AddressCore | null): string {
  if (!addr) return '';
  if (typeof addr.formatted === 'string' && addr.formatted.trim()) {
    return addr.formatted.trim();
  }
  const parts = [
    addr.line1,
    addr.line2,
    addr.locality,
    addr.adminArea,
    addr.postalCode,
    addr.countryCode,
  ].filter((x): x is string => !!x && x.trim().length > 0);
  return parts.join(', ');
}

function preferredUserAddress(u?: Partial<User> | null): string {
  if (!u) return '';
  const p = addressCoreToString(u.profileAddress as AddressCore | undefined);
  if (p) return p;
  return addressCoreToString(
    (u as any)?.lastKnownLocation?.address as AddressCore | undefined
  );
}

function fullNameFromUser(u?: Partial<User> | null): string {
  if (!u) return '';
  const f = (u.firstName ?? '').trim();
  const l = (u.lastName ?? '').trim();
  const joined = `${f} ${l}`.trim();
  return joined || (u.name ?? '');
}

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[^\d.-]/g, '')) || 0;
  return 0;
};

/* ================= Commission types & helpers ================= */

type PercentCommissionPolicy = { mode: 'percent'; rate: number; min?: number; max?: number };
type FlatCommissionPolicy = { mode: 'flat'; amount: number };
type LocalCommissionPolicy = PercentCommissionPolicy | FlatCommissionPolicy;

const DEFAULT_COMMISSION_POLICY: LocalCommissionPolicy = { mode: 'percent', rate: 0.05 };

function isFlatPolicy(p: LocalCommissionPolicy): p is FlatCommissionPolicy {
  return p.mode === 'flat';
}
function isPercentPolicy(p: LocalCommissionPolicy): p is PercentCommissionPolicy {
  return p.mode === 'percent';
}

function isProgramActiveNow(p: Program): boolean {
  const now = Date.now();
  const s = p.startDate?.toMillis?.() ?? null;
  const e = p.endDate?.toMillis?.() ?? null;
  if (p.isActive === false) return false;
  if (s && s > now) return false;
  if (e && e < now) return false;
  return true;
}

/** Chuẩn hoá policy từ nhiều schema khác nhau của Program */
function coerceCommissionPolicyFromProgram(raw: any): LocalCommissionPolicy {
  const p = raw?.commissionPolicy;
  if (p && typeof p === 'object') {
    if (p.mode === 'flat') {
      return { mode: 'flat', amount: Number(p.amount || 0) };
    }
    const rate =
      typeof p.rate === 'number'
        ? p.rate
        : typeof p.percent === 'number'
        ? (p.percent > 1 ? p.percent / 100 : p.percent)
        : 0.05;
    return {
      mode: 'percent',
      rate,
      min: typeof p.min === 'number' ? p.min : undefined,
      max: typeof p.max === 'number' ? p.max : undefined,
    };
  }

  // legacy fields
  if (raw?.commissionMode === 'flat' || typeof raw?.flatCommission === 'number') {
    return { mode: 'flat', amount: Number(raw?.flatCommission || raw?.commissionAmount || 0) };
  }

  const rateRaw =
    typeof raw?.commissionRate === 'number'
      ? raw.commissionRate
      : typeof raw?.commissionPercent === 'number'
      ? raw.commissionPercent
      : typeof raw?.rate === 'number'
      ? raw.rate
      : 5; // 5%
  const rate = rateRaw > 1 ? rateRaw / 100 : rateRaw;

  const min = typeof raw?.minCommission === 'number' ? raw.minCommission : undefined;
  const max = typeof raw?.maxCommission === 'number' ? raw.maxCommission : undefined;

  return {
    mode: 'percent',
    rate: Number.isFinite(rate) ? rate : DEFAULT_COMMISSION_POLICY.rate,
    min,
    max,
  };
}

/** ✅ Tính hoa hồng (VNĐ) */
function computeCommission(total: number, policy: LocalCommissionPolicy): number {
  if (!Number.isFinite(total) || total <= 0) return 0;

  switch (policy.mode) {
    case 'percent': {
      const { rate, min, max } = policy;
      const raw = Math.max(0, total * rate);
      const withMin = min != null ? Math.max(raw, min) : raw;
      const bounded = max != null ? Math.min(withMin, max) : withMin;
      return Math.max(0, Math.floor(bounded)); // làm tròn xuống cho VNĐ
    }
    case 'flat': {
      const { amount } = policy;
      return Math.max(0, amount || 0);
    }
  }
}

/** ✅ Serialize sang kiểu CommissionPolicy đã export từ hook hoa hồng */
function serializeCommissionPolicy(policy: LocalCommissionPolicy): CommissionPolicy {
  switch (policy.mode) {
    case 'percent':
      return {
        mode: 'percent',
        rate: policy.rate,
        ...(policy.min != null ? { min: policy.min } : {}),
        ...(policy.max != null ? { max: policy.max } : {}),
      } as CommissionPolicy;
    case 'flat':
      return { mode: 'flat', amount: policy.amount } as CommissionPolicy;
  }
}

/* ================= Firestore loaders (Agent programs) ================= */

async function loadActiveAgentPrograms(agentId: string): Promise<Program[]> {
  // 1) lấy các program agent đã "joined"
  const partSnap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  );
  const programIds = Array.from(
    new Set(partSnap.docs.map((d) => (d.data() as any)?.programId).filter(Boolean))
  );
  if (!programIds.length) return [];

  // 2) fetch programs theo ID (chunk 10)
  const all: Program[] = [];
  for (let i = 0; i < programIds.length; i += 10) {
    const part = programIds.slice(i, i + 10);
    const ps = await getDocs(
      query(collection(db, 'programs'), where(documentId(), 'in', part))
    );
    ps.docs.forEach((d) => all.push({ id: d.id, ...(d.data() as any) } as Program));
  }

  // 3) filter theo loại + thời gian
  return all.filter((p) => p.type === 'agent_program' && isProgramActiveNow(p));
}

function pickBestCommissionPolicy(programs: Program[]): { programId?: string; policy: LocalCommissionPolicy } {
  for (const p of programs) {
    const pol = coerceCommissionPolicyFromProgram(p);
    if (isPercentPolicy(pol) && (pol.min != null || pol.max != null)) {
      return { programId: p.id, policy: pol };
    }
    if (isFlatPolicy(pol) && pol.amount > 0) {
      return { programId: p.id, policy: pol };
    }
  }
  if (programs.length) {
    return { programId: programs[0].id, policy: coerceCommissionPolicyFromProgram(programs[0]) };
  }
  return { policy: DEFAULT_COMMISSION_POLICY };
}

/* ================= Main hook ================= */

export function useBookingForm(companyId: string, userId: string) {
  const rentalForm = useRentalForm(companyId, userId);
  const { role, user } = useUser();
  const isAdmin = role === 'Admin';
  const { formData, setFormData } = rentalForm;
  const { stations, loading: stationsLoading } = useRentalStations(companyId, isAdmin);

  // Hook ghi lịch sử commission
  const { addCommissionEntry } = useCommissionHistory();

  /* ✅ Prefill renter info từ user đang đăng nhập (giữ logic cũ) */
  React.useEffect(() => {
    if (!user) return;
    setFormData((prev: any) => ({
      ...prev,
      fullName: prev?.fullName || fullNameFromUser(user),
      phone: prev?.phone || (user.phone ?? ''),
      idNumber: prev?.idNumber || (user.idNumber ?? ''),
      address: prev?.address || preferredUserAddress(user),
      deliveryAddress: prev?.deliveryAddress || preferredUserAddress(user),
    }));
  }, [user, setFormData]);

  /* ⏱ Tự tính rentalEndDate khi thay đổi input */
  React.useEffect(() => {
    const d = formData?.rentalStartDate;
    const h = formData?.rentalStartHour;
    const days = Number(formData?.rentalDays ?? 0);
    if (!d || !h || !days) return;

    const start = new Date(`${d}T${h}:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    const newEndStr = end.toISOString().slice(0, 10);
    if ((formData as any)?.rentalEndDate !== newEndStr) {
      setFormData((prev: any) => ({ ...prev, rentalEndDate: newEndStr }));
    }
  }, [formData?.rentalStartDate, formData?.rentalStartHour, formData?.rentalDays, setFormData]);

  /* 💰 Tự tính totalAmount & remainingBalance (giữ logic cũ) */
  React.useEffect(() => {
    const basePrice = toNumber(formData?.basePrice);
    const days = Number(formData?.rentalDays || 0);
    const batteryFee = toNumber(formData?.batteryFee);
    const deposit = toNumber(formData?.deposit);
    const extras = 0;

    const total = Math.max(0, basePrice * days + batteryFee + extras);
    const remaining = Math.max(0, total - deposit);

    if (formData?.totalAmount !== total || formData?.remainingBalance !== remaining) {
      setFormData((prev: any) => ({ ...prev, totalAmount: total, remainingBalance: remaining }));
    }
  }, [formData?.basePrice, formData?.rentalDays, formData?.batteryFee, formData?.deposit, setFormData]);

  const handleSubmit = async (): Promise<SubmitResult> => {
    if (!formData?.rentalStartDate || !formData?.rentalStartHour || !formData?.rentalDays) {
      return { status: 'validation_error' };
    }

    try {
      const startDate = new Date(`${formData.rentalStartDate}T${formData.rentalStartHour}:00`);
      const tmpEnd = new Date(startDate);
      tmpEnd.setDate(startDate.getDate() + Number(formData.rentalDays || 0));
      const endDate = formData.rentalEndDate ? new Date(formData.rentalEndDate) : tmpEnd;

      // === 1) Lấy chương trình Agent đang tham gia & policy (nếu có userId)
      const joinedPrograms = userId ? await loadActiveAgentPrograms(userId) : [];
      const { programId: pickedProgramId, policy } =
        joinedPrograms.length > 0 ? pickBestCommissionPolicy(joinedPrograms) : { policy: DEFAULT_COMMISSION_POLICY };

      // === 2) Tính hoa hồng theo totalAmount hiện tại
      const total = Number(formData.totalAmount) || 0;
      const commissionAmount = computeCommission(total, policy);

      // === 3) Build booking payload (giữ y nguyên schema cũ, chỉ thêm block commission và agent info)
      const bookingData: Omit<Booking, 'id'> = {
        companyId,
        stationId: formData.stationId || '',
        userId: userId || '',

        idImage: formData.idImage || '',
        fullName: formData.fullName || fullNameFromUser(user),
        channel: formData.channel || '',
        phone: formData.phone || (user?.phone ?? ''),
        idNumber: formData.idNumber || (user?.idNumber ?? ''),
        address: formData.address || preferredUserAddress(user),

        vehicleSearch: formData.vehicleSearch || '',
        vehicleModel: formData.vehicleModel || '',
        vehicleColor: formData.vehicleColor || '',
        vin: formData.vin || '',
        licensePlate: formData.licensePlate || '',

        batteryCode1: formData.batteryCode1 || '',
        batteryCode2: formData.batteryCode2 || '',
        batteryCode3: formData.batteryCode3 || '',
        batteryCode4: formData.batteryCode4 || '',

        rentalStartDate: Timestamp.fromDate(startDate),
        rentalStartHour: formData.rentalStartHour || '',
        rentalDays: Number(formData.rentalDays || 0),
        rentalEndDate: Timestamp.fromDate(endDate),

        package: formData.package || '',
        basePrice: Number(formData.basePrice) || 0,
        batteryFee: Number(formData.batteryFee) || 0,
        totalAmount: total,
        deposit: Number(formData.deposit) || 0,
        remainingBalance: Number(formData.remainingBalance) || 0,

        deliveryMethod: formData.deliveryMethod || 'Pickup at Shop',
        deliveryAddress: formData.deliveryAddress || preferredUserAddress(user),

        helmet: formData.helmet ?? false,
        charger: formData.charger ?? false,
        phoneHolder: formData.phoneHolder ?? false,
        rearRack: formData.rearRack ?? false,
        raincoat: formData.raincoat ?? false,

        note: formData.note || '',

        bookingStatus: formData.bookingStatus || 'draft',
        statusComment: formData.statusComment || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // ✅ serialize policy về đúng union type dùng cho commissionHistory
      const serializedPolicy = serializeCommissionPolicy(policy);

      // === 4) Ghi booking + block commission
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        agentId: userId || null,
        agentProgramId: pickedProgramId || null,
        commission: {
          ...serializedPolicy,
          amount: commissionAmount,
          currency: 'VND' as const,
          status: 'pending' as const,
          computedAt: Timestamp.now(),
        },
      });

      // === 5) Ghi lịch sử commission riêng (chỉ khi có agentId)
      if (userId) {
        await addCommissionEntry({
          bookingId: docRef.id,
          agentId: userId,
          agentProgramId: pickedProgramId,
          amount: commissionAmount,
          currency: 'VND',
          status: 'pending',
          policy: serializedPolicy as CommissionPolicy,
          snapshot: {
            totalAmount: total,
            basePrice: Number(formData.basePrice) || 0,
            rentalDays: Number(formData.rentalDays) || 0,
            batteryFee: Number(formData.batteryFee) || 0,
            deposit: Number(formData.deposit) || 0,
          },
          // bạn có thể dùng dedupeKey nếu muốn idempotent mạnh hơn:
          // dedupeKey: `${docRef.id}|pending`,
        });
      }

      // ✅ Cập nhật trạng thái xe (nếu có vin)
      if (bookingData.vin) {
        const vehicleSnap = await getDocs(
          query(collection(db, 'vehicles'), where('vehicleID', '==', bookingData.vin))
        );
        if (!vehicleSnap.empty) {
          const vehicleDoc = vehicleSnap.docs[0];
          await updateDoc(vehicleDoc.ref, { status: 'In Use' });
        }
      }

      // ✅ Cập nhật trạng thái pin (nếu có)
      if (bookingData.batteryCode1) {
        const batterySnap = await getDocs(
          query(collection(db, 'batteries'), where('batteryCode', '==', bookingData.batteryCode1))
        );
        if (!batterySnap.empty) {
          const batteryDoc = batterySnap.docs[0];
          await updateDoc(batteryDoc.ref, { status: 'in_use' });
        }
      }

      return { status: 'success', booking: { id: docRef.id, ...bookingData } as Booking };
    } catch (error) {
      console.error('❌ Booking failed:', error);
      return { status: 'error' };
    }
  };

  return {
    ...rentalForm,
    stations,
    stationsLoading,
    handleSubmit,
  };
}
