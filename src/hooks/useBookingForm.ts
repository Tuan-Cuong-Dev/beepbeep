// Đây là chương trình chuẩn đã tích hợp hoa hồng CTV/Đại lý theo chương trình & model
// Đã hoạt động tốt. Tính đúng chiết khấu cho CTV
// 11/09/2025

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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { useRentalForm } from './useRentalForm';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { useUser } from '@/src/context/AuthContext';
import type { User } from '@/src/lib/users/userTypes';
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import type { Program } from '@/src/lib/programs/rental-programs/programsType';
import {
  useCommissionHistory,
  type CommissionPolicy as SerializedCommissionPolicy,
} from '@/src/hooks/useCommissionHistory';

/* ================= Helpers: Address / User ================= */

const asDeliveryMethod = (v: any): Booking['deliveryMethod'] =>
  v === 'Deliver to Address' ? 'Deliver to Address' : 'Pickup at Shop';

const asBookingStatus = (v: any): Booking['bookingStatus'] => {
  switch (v) {
    case 'confirmed':
    case 'returned':
    case 'completed':
    case 'cancelled':
      return v;
    default:
      return 'draft';
  }
};

const money = (v: any) =>
  typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.-]/g, '')) || 0 : 0;

function addressCoreToString(addr?: AddressCore | null): string {
  if (!addr) return '';
  if (typeof addr.formatted === 'string' && addr.formatted.trim()) return addr.formatted.trim();
  const parts = [addr.line1, addr.line2, addr.locality, addr.adminArea, addr.postalCode, addr.countryCode]
    .filter((x): x is string => !!x && x.trim().length > 0);
  return parts.join(', ');
}
function preferredUserAddress(u?: Partial<User> | null): string {
  if (!u) return '';
  const p = addressCoreToString(u?.profileAddress as AddressCore | undefined);
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

/* ================= Safe coercers ================= */
const toNumber = (v: unknown): number =>
  typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.-]/g, '')) || 0 : 0;
const toString = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const toBool = (v: unknown): boolean => v === true;

/* ================= Model resolvers ================= */
const looksLikeId = (s: string) => /^[A-Za-z0-9_-]{18,}$/.test(s);

async function resolveModelId(formData: any, companyId: string): Promise<string> {
  const cand = toString(formData?.modelId) || toString(formData?.vehicleModelId);
  if (cand) return cand;

  const vm = toString(formData?.vehicleModel);
  if (vm && looksLikeId(vm)) return vm;

  if (vm) {
    const msnap = await getDocs(query(collection(db, 'vehicleModels'), where('name', '==', vm)));
    if (!msnap.empty) return msnap.docs[0].id;
  }

  const vin = toString(formData?.vin);
  if (vin) {
    const vsnap = await getDocs(query(collection(db, 'vehicles'), where('vehicleID', '==', vin)));
    if (!vsnap.empty) {
      const mdl = toString(vsnap.docs[0].data()?.modelId);
      if (mdl) return mdl;
    }
  }

  if (vm && companyId) {
    const vsnap = await getDocs(
      query(collection(db, 'vehicles'), where('companyId', '==', companyId), where('modelName', '==', vm))
    );
    if (!vsnap.empty) return toString(vsnap.docs[0].data()?.modelId);
  }

  return '';
}

/* ================= Discounts ================= */

type DiscountHit =
  | { kind: 'fixed'; value: number }            // VND / ngày
  | { kind: 'percentage'; value: number };      // % (0..100)

function getDiscountForModel(program: any, modelId: string): DiscountHit | null {
  const md = program?.modelDiscounts;
  if (!md) return null;

  if (typeof md === 'object' && !Array.isArray(md)) {
    const v = money(md[modelId]);
    return v > 0 ? { kind: 'fixed', value: v } : null;
  }
  if (Array.isArray(md)) {
    const hit = md.find((x: any) => x?.modelId === modelId);
    if (!hit) return null;
    if (hit.discountType === 'fixed') return { kind: 'fixed', value: money(hit.discountValue) };
    if (hit.discountType === 'percentage') {
      const pct = Number(hit.discountValue) || 0;
      return pct > 0 ? { kind: 'percentage', value: pct } : null;
    }
  }
  return null;
}

function pickDiscountFromPrograms(programs: any[], modelId: string, stationId?: string) {
  const targeted = stationId
    ? programs.filter(
        (p) => Array.isArray(p?.stationTargets) && p.stationTargets.some((st: any) => st?.stationId === stationId)
      )
    : [];
  const general = programs.filter((p) => !Array.isArray(p?.stationTargets) || p.stationTargets.length === 0);

  for (const p of [...targeted, ...general]) {
    const d = getDiscountForModel(p, modelId);
    if (d) return { program: p, discount: d };
  }
  return { program: undefined, discount: null };
}

/* ================= Commission (program-based) ================= */

type CommissionAudience = 'agent' | 'dealer';
type PercentCommissionPolicy = { mode: 'percent'; rate: number; min?: number; max?: number };
type FlatCommissionPolicy = { mode: 'flat'; amount: number };
type LocalCommissionPolicy = PercentCommissionPolicy | FlatCommissionPolicy;

const isPercentPolicy = (p?: LocalCommissionPolicy | null): p is PercentCommissionPolicy =>
  !!p && p.mode === 'percent';
const isFlatPolicy = (p?: LocalCommissionPolicy | null): p is FlatCommissionPolicy =>
  !!p && p.mode === 'flat';

const roundVND = (n: number) => Math.round(n + Number.EPSILON);

function computeCommissionFromPolicy(policy: LocalCommissionPolicy | null | undefined, base: number) {
  const b = Math.max(0, Number(base) || 0);
  if (!policy) return 0;
  if (isPercentPolicy(policy)) {
    const pct = Math.max(0, Math.min(1, Number(policy.rate) || 0));
    let val = b * pct;
    if (typeof policy.min === 'number') val = Math.max(val, policy.min);
    if (typeof policy.max === 'number') val = Math.min(val, policy.max);
    return roundVND(val);
  }
  if (isFlatPolicy(policy)) return roundVND(Math.max(0, Number(policy.amount) || 0));
  return 0;
}

function serializeCommissionPolicy(policy: LocalCommissionPolicy | null | undefined): SerializedCommissionPolicy {
  if (!policy) return { mode: 'flat', amount: 0 };
  return policy.mode === 'percent'
    ? { mode: 'percent', rate: policy.rate, ...(policy.min != null ? { min: policy.min } : {}), ...(policy.max != null ? { max: policy.max } : {}) }
    : { mode: 'flat', amount: policy.amount };
}

function isProgramActiveNow(p: any): boolean {
  const now = Date.now();
  const s = p?.startDate?.toMillis?.() ?? null;
  const e = p?.endDate?.toMillis?.() ?? null;
  if (p?.isActive === false) return false;
  if (s && s > now) return false;
  if (e && e < now) return false;
  return true;
}

async function loadActiveRentalPrograms(companyId: string): Promise<Program[]> {
  if (!companyId) return [];
  const snap = await getDocs(
    query(collection(db, 'programs'), where('type', '==', 'rental_program'), where('companyId', '==', companyId), where('isActive', '==', true))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Program)).filter(isProgramActiveNow);
}

function pickCommissionPolicyFromPrograms(
  programs: Program[],
  modelId: string,
  audience: CommissionAudience,
  stationId?: string
): { program?: Program; policy?: LocalCommissionPolicy | null } {
  const targeted = stationId
    ? programs.filter(
        (p) => Array.isArray(p?.stationTargets) && p.stationTargets.some((st: any) => st?.stationId === stationId)
      )
    : [];
  const general = programs.filter((p) => !Array.isArray(p?.stationTargets) || p.stationTargets.length === 0);

  const readPolicy = (program: any): LocalCommissionPolicy | null => {
    const list = Array.isArray(program?.modelCommissions) ? program.modelCommissions : [];
    const hit = list.find((x: any) => x?.modelId === modelId);
    if (!hit) return null;
    const raw = hit?.[audience];
    if (!raw || typeof raw !== 'object') return null;
    if (raw.mode === 'percent') {
      const rate = Number(raw.rate) || 0;
      const min = typeof raw.min === 'number' ? raw.min : undefined;
      const max = typeof raw.max === 'number' ? raw.max : undefined;
      return { mode: 'percent', rate: rate > 1 ? rate / 100 : rate, ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) };
    }
    if (raw.mode === 'flat') return { mode: 'flat', amount: Number(raw.amount) || 0 };
    return null;
  };

  for (const p of [...targeted, ...general]) {
    const pol = readPolicy(p);
    if (pol) return { program: p, policy: pol };
  }
  return { program: undefined, policy: null };
}

/* ================= Main hook ================= */

export function useBookingForm(companyId: string, userId: string) {
  const rentalForm = useRentalForm(companyId, userId);
  const { role, user } = useUser();
  const isAdmin = role === 'Admin';
  const { formData, setFormData } = rentalForm;
  const { stations, loading: stationsLoading } = useRentalStations(companyId, isAdmin);
  const { addCommissionEntry } = useCommissionHistory();

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

  React.useEffect(() => {
    const basePrice = toNumber(formData?.basePrice);
    const days = Number(formData?.rentalDays || 0);
    const batteryFee = toNumber(formData?.batteryFee);
    const deposit = toNumber(formData?.deposit);
    const total = Math.max(0, basePrice * days + batteryFee);
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

      // 1) Resolve modelId cực chắc
      const modelId = await resolveModelId(formData, companyId);

      // 2) Lấy programs đang hiệu lực + policy theo model + audience
      const programs = await loadActiveRentalPrograms(companyId);
      const audience: CommissionAudience = (role?.toLowerCase?.() === 'dealer' ? 'dealer' : 'agent');

      console.log('🔎 DEBUG Commission Input', {
        companyId, userId, role, audience, modelId,
        stationId: formData?.stationId, totalAmount: formData?.totalAmount,
      });

      const { program: commissionProgram, policy: commissionPolicy } =
        pickCommissionPolicyFromPrograms(programs, modelId, audience, toString(formData?.stationId) || undefined);

      console.log('🔎 DEBUG Commission Policy Picked', { commissionProgram, commissionPolicy });

      const total = Number(formData.totalAmount) || 0;
      const days = Number(formData.rentalDays) || 0;

      // 3) Tính commission
      let commissionAmount = 0;
      let serializedPolicy: SerializedCommissionPolicy = { mode: 'flat', amount: 0 };
      let programRefForCommission: string | null = commissionProgram?.id ?? null;

      if (commissionPolicy) {
        commissionAmount = computeCommissionFromPolicy(commissionPolicy, total);
        serializedPolicy = serializeCommissionPolicy(commissionPolicy);
        console.log('✅ Commission by modelCommissions', { commissionAmount, serializedPolicy });
      } else {
        // Fallback theo discount
        const { program: dprog, discount } = pickDiscountFromPrograms(programs, modelId, toString(formData?.stationId));
        let perDay = 0;

        if (discount?.kind === 'fixed') {
          perDay = discount.value;
          commissionAmount = Math.round(Math.max(0, perDay) * days);
          serializedPolicy = { mode: 'flat', amount: perDay };
          programRefForCommission = dprog?.id ?? null;
          console.log('✅ Commission by modelDiscounts (fixed/day)', { perDay, days, commissionAmount });
        } else if (discount?.kind === 'percentage') {
          // NOTE (nếu muốn bật % cho fallback):
          // const per = Math.max(0, Math.min(100, discount.value));
          // const baseForDay = Math.max(0, toNumber(formData.basePrice));
          // commissionAmount = Math.round((baseForDay * (per / 100)) * days);
          // serializedPolicy = { mode: 'percent', rate: per > 1 ? per / 100 : per };
          // programRefForCommission = dprog?.id ?? null;
          console.log('ℹ️ Discount is percentage for customer — fallback commission left 0 by current business rule.');
          commissionAmount = 0;
          serializedPolicy = { mode: 'flat', amount: 0 };
          programRefForCommission = dprog?.id ?? null;
        } else {
          console.log('⚠️ No commission policy and no discount → 0');
          commissionAmount = 0;
          serializedPolicy = { mode: 'flat', amount: 0 };
        }
      }

      // 4) Build booking payload (đủ field, không undefined)
      const bookingData: Omit<Booking, 'id'> = {
        companyId,
        stationId: toString(formData.stationId),
        userId: toString(userId),

        idImage: toString(formData.idImage),
        fullName: toString(formData.fullName) || fullNameFromUser(user),
        channel: toString(formData.channel),
        phone: toString(formData.phone) || toString((user as any)?.phone),
        idNumber: toString(formData.idNumber) || toString((user as any)?.idNumber),
        address: toString(formData.address) || preferredUserAddress(user),

        vehicleSearch: toString(formData.vehicleSearch),
        vehicleModel: toString(formData.vehicleModel),
        vehicleColor: toString(formData.vehicleColor),
        vin: toString(formData.vin),
        licensePlate: toString(formData.licensePlate),

        batteryCode1: toString(formData.batteryCode1),
        batteryCode2: toString(formData.batteryCode2),
        batteryCode3: toString(formData.batteryCode3),
        batteryCode4: toString(formData.batteryCode4),

        rentalStartDate: Timestamp.fromDate(startDate),
        rentalStartHour: toString(formData.rentalStartHour),
        rentalDays: days,
        rentalEndDate: Timestamp.fromDate(endDate),

        package: toString(formData.package),
        basePrice: toNumber(formData.basePrice),
        batteryFee: toNumber(formData.batteryFee),
        totalAmount: total,
        deposit: toNumber(formData.deposit),
        remainingBalance: Number(formData.remainingBalance || Math.max(0, total - toNumber(formData.deposit))),

        deliveryMethod: asDeliveryMethod(formData.deliveryMethod),
        deliveryAddress: toString(formData.deliveryAddress) || preferredUserAddress(user),

        helmet: toBool(formData.helmet),
        charger: toBool(formData.charger),
        phoneHolder: toBool(formData.phoneHolder),
        rearRack: toBool(formData.rearRack),
        raincoat: toBool(formData.raincoat),

        note: toString(formData.note),

        bookingStatus: asBookingStatus(formData.bookingStatus),
        statusComment: toString(formData.statusComment),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // 5) Lưu booking + snapshot commission
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        agentId: toString(userId) || null,
        commission: {
          audience,
          policy: serializedPolicy,
          programRef: programRefForCommission,
          amount: commissionAmount,
          currency: 'VND',
          status: 'pending',
          computedAt: serverTimestamp(),
        },
      });

      // 6) Lịch sử hoa hồng
      await addCommissionEntry({
        bookingId: docRef.id,
        agentId: toString(userId),
        agentProgramId: programRefForCommission,
        amount: commissionAmount,
        currency: 'VND',
        status: 'pending',
        policy: serializedPolicy,
        snapshot: {
          totalAmount: total,
          basePrice: toNumber(formData.basePrice),
          rentalDays: days,
          batteryFee: toNumber(formData.batteryFee),
          deposit: toNumber(formData.deposit),
        },
      });

      // 7) Cập nhật trạng thái xe/pin
      if (bookingData.vin) {
        const vehicleSnap = await getDocs(
          query(collection(db, 'vehicles'), where('vehicleID', '==', bookingData.vin))
        );
        if (!vehicleSnap.empty) {
          await updateDoc(vehicleSnap.docs[0].ref, { status: 'In Use' });
        }
      }
      if (bookingData.batteryCode1) {
        const batterySnap = await getDocs(
          query(collection(db, 'batteries'), where('batteryCode', '==', bookingData.batteryCode1))
        );
        if (!batterySnap.empty) {
          await updateDoc(batterySnap.docs[0].ref, { status: 'in_use' });
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
