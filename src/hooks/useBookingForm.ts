'use client';

import * as React from 'react';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
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
import { useCommissionHistory, CommissionPolicy as SerializedCommissionPolicy } from '@/src/hooks/useCommissionHistory';

/* ================= Helpers: Address / User ================= */

function addressCoreToString(addr?: AddressCore | null): string {
  if (!addr) return '';
  if (typeof addr.formatted === 'string' && addr.formatted.trim()) return addr.formatted.trim();
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
  return addressCoreToString((u as any)?.lastKnownLocation?.address as AddressCore | undefined);
}

function fullNameFromUser(u?: Partial<User> | null): string {
  if (!u) return '';
  const f = (u?.firstName ?? '').trim();
  const l = (u?.lastName ?? '').trim();
  const joined = `${f} ${l}`.trim();
  return joined || (u?.name ?? '');
}

const money = (v: any) =>
  typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.-]/g, '')) || 0 : 0;

/* ================= Commission ================= */

type PercentCommissionPolicy = { mode: 'percent'; rate: number; min?: number; max?: number };
type FlatCommissionPolicy = { mode: 'flat'; amount: number };
type LocalCommissionPolicy = PercentCommissionPolicy | FlatCommissionPolicy;

const DEFAULT_COMMISSION_POLICY: LocalCommissionPolicy = { mode: 'percent', rate: 0.05 };

function computeCommission(total: number, policy: LocalCommissionPolicy): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  switch (policy.mode) {
    case 'percent': {
      const { rate, min, max } = policy;
      const raw = Math.max(0, total * rate);
      const withMin = min != null ? Math.max(raw, min) : raw;
      const bounded = max != null ? Math.min(withMin, max) : withMin;
      return Math.max(0, Math.floor(bounded));
    }
    case 'flat':
      return Math.max(0, Math.floor(policy.amount || 0));
  }
}

function serializeCommissionPolicy(policy: LocalCommissionPolicy): SerializedCommissionPolicy {
  return policy.mode === 'percent'
    ? { mode: 'percent', rate: policy.rate, ...(policy.min != null ? { min: policy.min } : {}), ...(policy.max != null ? { max: policy.max } : {}) }
    : { mode: 'flat', amount: policy.amount };
}

/* ================= Rental Program (discount) ================= */

const isProgramActiveNow = (p: any) => {
  const now = Date.now();
  const s = p?.startDate?.toMillis?.() ?? null;
  const e = p?.endDate?.toMillis?.() ?? null;
  if (p?.isActive === false) return false;
  if (s && s > now) return false;
  if (e && e < now) return false;
  return true;
};

async function loadActiveRentalPrograms(companyId: string) {
  if (!companyId) return [];
  const snap = await getDocs(
    query(
      collection(db, 'programs'),
      where('type', '==', 'rental_program'),
      where('companyId', '==', companyId),
      where('isActive', '==', true)
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(isProgramActiveNow);
}

function getFixedDiscountFromProgram(p: any, modelId: string): number {
  const md = p?.modelDiscounts;
  if (!md) return 0;
  if (typeof md === 'object' && !Array.isArray(md)) return money(md[modelId]);
  if (Array.isArray(md)) {
    const hit = md.find((x: any) => x?.modelId === modelId);
    return money(hit?.discountValue);
  }
  return 0;
}

function pickFixedDiscount(programs: any[], modelId: string, stationId?: string) {
  const prioritized = [
    ...programs.filter(p => Array.isArray(p.stationIds) && stationId && p.stationIds.includes(stationId)),
    ...programs.filter(p => !Array.isArray(p.stationIds) || p.stationIds.length === 0),
  ];
  for (const p of prioritized) {
    const v = getFixedDiscountFromProgram(p, modelId);
    if (v > 0) return { programId: p.id, discountPerDay: v };
  }
  return { programId: undefined, discountPerDay: 0 };
}

/* ================= Hook ================= */

export function useBookingForm(companyId: string, userId: string) {
  const rentalForm = useRentalForm(companyId, userId);
  const { role, user } = useUser();
  const isAdmin = role === 'Admin';
  const { formData, setFormData } = rentalForm;
  const { stations, loading: stationsLoading } = useRentalStations(companyId, isAdmin);
  const { addCommissionEntry } = useCommissionHistory();

  // Discount state
  const [discountPerDay, setDiscountPerDay] = React.useState(0);
  const [discountSourceProgramId, setDiscountSourceProgramId] = React.useState<string | undefined>(undefined);

  // Prefill user info
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

  // Auto compute rentalEndDate
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

  // Load rental_program discount
  const modelId: string = (formData as any)?.modelId || (formData as any)?.vehicleModelId || '';
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setDiscountPerDay(0);
      setDiscountSourceProgramId(undefined);
      if (!companyId || !modelId) return;
      const programs = await loadActiveRentalPrograms(companyId);
      const { programId, discountPerDay } = pickFixedDiscount(programs, modelId, formData?.stationId || undefined);
      if (!alive) return;
      setDiscountPerDay(Math.max(0, money(discountPerDay)));
      setDiscountSourceProgramId(programId);
    })();
    return () => { alive = false; };
  }, [companyId, modelId, formData?.stationId]);

  // Auto compute totals with discount
  React.useEffect(() => {
    const basePrice = money(formData?.basePrice);
    const days = Number(formData?.rentalDays || 0);
    const batteryFee = money(formData?.batteryFee);
    const deposit = money(formData?.deposit);

    const effectiveBase = Math.max(0, basePrice - (discountPerDay || 0));
    const total = Math.max(0, effectiveBase * days + batteryFee);
    const remaining = Math.max(0, total - deposit);

    if (formData?.totalAmount !== total || formData?.remainingBalance !== remaining || (formData as any)?.discountedBasePrice !== effectiveBase) {
      setFormData((prev: any) => ({
        ...prev,
        discountedBasePrice: effectiveBase,
        totalAmount: total,
        remainingBalance: remaining,
      }));
    }
  }, [formData?.basePrice, formData?.rentalDays, formData?.batteryFee, formData?.deposit, discountPerDay, setFormData]);

  /* ================= Submit ================= */

  const handleSubmit = async (): Promise<SubmitResult> => {
    if (!formData?.rentalStartDate || !formData?.rentalStartHour || !formData?.rentalDays) {
      return { status: 'validation_error' };
    }

    try {
      const startDate = new Date(`${formData.rentalStartDate}T${formData.rentalStartHour}:00`);
      const tmpEnd = new Date(startDate);
      tmpEnd.setDate(startDate.getDate() + Number(formData.rentalDays || 0));
      const endDate = formData?.rentalEndDate ? new Date(formData.rentalEndDate) : tmpEnd;

      // Commission tính sau khi total đã discount
      const total = Number(formData.totalAmount) || 0;
      const commissionAmount = computeCommission(total, DEFAULT_COMMISSION_POLICY);
      const serializedPolicy = serializeCommissionPolicy(DEFAULT_COMMISSION_POLICY);

      const bookingData: Omit<Booking, 'id'> = {
        companyId,
        stationId: formData.stationId || '',
        userId: userId || '',
        fullName: formData.fullName || fullNameFromUser(user),
        phone: formData.phone || (user?.phone ?? ''),
        idNumber: formData.idNumber || (user?.idNumber ?? ''),
        address: formData.address || preferredUserAddress(user),
        vehicleModel: formData.vehicleModel || '',
        rentalStartDate: Timestamp.fromDate(startDate),
        rentalStartHour: formData.rentalStartHour || '',
        rentalDays: Number(formData.rentalDays || 0),
        rentalEndDate: Timestamp.fromDate(endDate),
        basePrice: money(formData.basePrice),
        batteryFee: money(formData.batteryFee),
        totalAmount: total,
        deposit: money(formData.deposit),
        remainingBalance: money(formData.remainingBalance),
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        vehicleColor: '',
        vin: '',
        deliveryMethod: 'Pickup at Shop',
        bookingStatus: 'draft'
      };

      const batch = writeBatch(db);
      const bookingDoc = doc(collection(db, 'bookings'));
      const bookingId = bookingDoc.id;

      batch.set(bookingDoc, {
        ...bookingData,
        promotion: {
          type: 'rental_program',
          programId: discountSourceProgramId || null,
          modelId: modelId || null,
          discountPerDay,
          discountedBasePrice: Math.max(0, money(formData.basePrice) - discountPerDay),
        },
        commission: {
          ...serializedPolicy,
          amount: commissionAmount,
          currency: 'VND',
          status: 'pending',
          computedAt: serverTimestamp(),
        },
      });

      await batch.commit();

      await addCommissionEntry({
        bookingId,
        agentId: userId,
        amount: commissionAmount,
        currency: 'VND',
        status: 'pending',
        policy: serializedPolicy,
        snapshot: {
          totalAmount: total,
          basePrice: money(formData.basePrice),
          rentalDays: Number(formData.rentalDays) || 0,
          batteryFee: money(formData.batteryFee),
          deposit: money(formData.deposit),
        },
        dedupeKey: `${bookingId}|confirmed`,
      });

      return { status: 'success', booking: { id: bookingId, ...bookingData } as Booking };
    } catch (err) {
      console.error('❌ Booking failed:', err);
      return { status: 'error' };
    }
  };

  return { ...rentalForm, stations, stationsLoading, handleSubmit };
}
