// Hooks lấy nhanh các thông tin dành riêng cho Agent gồm
// Công ty, trạm, models, chương trình mà họ đã tham gia vào

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType';
import type { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
// ⬅️ thêm import này
import { Timestamp } from 'firebase/firestore';

/** Nhận Timestamp | Date | number(ms) | {seconds,nanoseconds} | string ISO → ms */
function safeToMillis(t: unknown): number | null {
  if (t == null) return null;

  // Firestore Timestamp
  if (t instanceof Timestamp) return t.toMillis();

  // Có toMillis() nhưng TS không biết kiểu
  if (typeof (t as any)?.toMillis === 'function') {
    const v = (t as any).toMillis();
    return typeof v === 'number' ? v : null;
  }

  // Date
  if (t instanceof Date) return t.getTime();

  // number (đã là milliseconds)
  if (typeof t === 'number') return t;

  // object kiểu { seconds, nanoseconds }
  if (typeof t === 'object') {
    const anyT = t as any;
    if (typeof anyT.seconds === 'number') {
      const ns = typeof anyT.nanoseconds === 'number' ? anyT.nanoseconds : 0;
      return anyT.seconds * 1000 + Math.floor(ns / 1e6);
    }
  }

  // string (ISO)
  if (typeof t === 'string') {
    const ms = new Date(t).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  return null;
}


type AnyRec = Record<string, unknown>;
const isRecord = (x: unknown): x is AnyRec => typeof x === 'object' && x !== null;
const chunk = <T,>(arr: T[], size = 10) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/* ====== copy nhẹ các helper “chuẩn hoá” từ file của bạn ====== */
function isProgramActiveNow(p: Program): boolean {
  const now = Date.now();
  const s = safeToMillis((p as any).startDate);
  const e = safeToMillis((p as any).endDate);
  return !((s && s > now) || (e && e < now)) && p.isActive !== false;
}
function extractCompanyId(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  return (
    (raw.companyId as string) ||
    (raw.organizerCompanyId as string) ||
    (raw.providerCompanyId as string) ||
    (isRecord(raw.company) && (raw.company.id as string)) ||
    (isRecord(raw.companyRef) && (raw.companyRef.id as string)) ||
    null
  );
}
function coerceModelDiscounts(raw: unknown, rawDocForLog?: unknown): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = [];
  const push = (modelId: unknown, discountType?: unknown, discountValue?: unknown, ctx?: unknown) => {
    const mid =
      (typeof modelId === 'string' && modelId) ||
      (isRecord(modelId) && (
        modelId.modelId || modelId.vehicleModelId || modelId.id ||
        (isRecord(modelId.model) && modelId.model.id) ||
        (isRecord(modelId.modelRef) && modelId.modelRef.id)
      ));
    if (!mid || typeof mid !== 'string') return;
    let type: 'fixed' | 'percentage' | undefined =
      discountType === 'fixed' || discountType === 'percentage' ? discountType as any : undefined;
    let val = typeof discountValue === 'number' ? discountValue : NaN;
    if (!type) {
      if (isRecord(ctx)) {
        const pct = ctx.percentage ?? ctx.pct ?? ctx.off;
        const fix = ctx.finalPrice ?? ctx.price ?? ctx.fixed;
        if (typeof pct === 'number') { type = 'percentage'; val = Number(pct); }
        else if (typeof fix === 'number') { type = 'fixed'; val = Number(fix); }
        else if ((ctx.type === 'fixed' || ctx.type === 'percentage') && typeof ctx.value === 'number') {
          type = ctx.type; val = Number(ctx.value);
        }
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'; val = Number(ctx);
      }
    }
    if (type !== 'fixed' && type !== 'percentage') type = 'fixed';
    if (Number.isNaN(val)) val = 0;
    out.push({ modelId: mid, discountType: type, discountValue: val });
  };
  if (Array.isArray(raw)) {
    raw.forEach((it) => {
      if (typeof it === 'string') push(it, 'fixed', 0, it);
      else if (isRecord(it)) push(it, it.discountType, it.discountValue, it);
    });
    return out;
  }
  if (isRecord(raw)) {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') push(k, undefined, undefined, v);
      else if (isRecord(v)) push({ modelId: k }, v.discountType, v.discountValue, v);
    });
    if (!out.length && isRecord(rawDocForLog)) {
      const fb = (rawDocForLog as AnyRec).models || (rawDocForLog as AnyRec).vehicleModels;
      if (Array.isArray(fb)) fb.forEach((x) => push(x as any, 'fixed', 0, x));
    }
  }
  return out;
}
function normalizeProgram(raw: unknown): (Program & {
  modelDiscounts: ProgramModelDiscount[];
  stationTargets: { stationId: string }[];
  companyId?: string | null;
  title?: string;
}) {
  const r = (raw || {}) as AnyRec;
  const modelDiscounts = coerceModelDiscounts(r.modelDiscounts, raw);
  const stationTargets = Array.isArray(r.stationTargets)
    ? (r.stationTargets as { stationId: string }[]).filter(x => !!x && typeof x.stationId === 'string')
    : [];
  return { ...(r as unknown as Program), modelDiscounts, stationTargets, companyId: extractCompanyId(r), title: (r.title as string) || '' };
}

/* ====== Firestore fetchers (rút gọn, dùng lại logic của bạn) ====== */
async function loadJoinedProgramsForAgent(agentId: string) {
  const pSnap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  );
  const programIds = Array.from(new Set(pSnap.docs.map(d => (d.data() as AnyRec)?.programId).filter(Boolean))) as string[];
  if (!programIds.length) return [] as ReturnType<typeof normalizeProgram>[];
  const all: ReturnType<typeof normalizeProgram>[] = [];
  for (const ids of chunk(programIds, 10)) {
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', ids)));
    ps.docs.forEach((d) => all.push(normalizeProgram({ id: d.id, ...(d.data() as AnyRec) })));
  }
  return all.filter(isProgramActiveNow);
}

async function loadVehicleModelsByIds(modelIds: string[], coll = 'vehicleModels'): Promise<Map<string, VehicleModel>> {
  const map = new Map<string, VehicleModel>();
  if (!modelIds.length) return map;
  for (const part of chunk(modelIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)));
    snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as AnyRec) } as VehicleModel));
  }
  return map;
}

async function loadCompaniesByIds(companyIds: string[], coll = 'rentalCompanies'): Promise<Map<string, { id: string; name: string }>> {
  const map = new Map<string, { id: string; name: string }>();
  if (!companyIds.length) return map;
  for (const part of chunk(companyIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)));
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec;
      map.set(d.id, { id: d.id, name: (data.name as string) || (data.title as string) || d.id });
    });
  }
  return map;
}

async function loadStationsByIds(stationIds: string[], coll = 'rentalStations'): Promise<Map<string, { id: string; name: string }>> {
  const map = new Map<string, { id: string; name: string }>();
  if (!stationIds.length) return map;
  for (const part of chunk(stationIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)));
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec;
      map.set(d.id, { id: d.id, name: (data.name as string) || d.id });
    });
  }
  return map;
}

/* ====== Hook chính: trả về options đã build sẵn ====== */
export type Option = { value: string; label: string };
export type UseAgentOptionsParams = {
  agentId: string;
  vehicleModelCollectionName?: string;
  companyCollectionName?: string;
  stationCollectionName?: string;
};
export function useAgentOptions({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  companyCollectionName = 'rentalCompanies',
  stationCollectionName = 'rentalStations',
}: UseAgentOptionsParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [programs, setPrograms] = useState<Array<ReturnType<typeof normalizeProgram>>>([]);
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [stationOptionsById, setStationOptionsById] = useState<Map<string, Option>>(new Map());
  const [stationOptionsByCompany, setStationOptionsByCompany] = useState<Map<string, Option[]>>(new Map());
  const [modelOptions, setModelOptions] = useState<Option[]>([]);
  const [programOptions, setProgramOptions] = useState<Option[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Chương trình Agent đã tham gia & đang active
        const joined = await loadJoinedProgramsForAgent(agentId);
        if (!mounted) return;
        setPrograms(joined);

        // 2) Gom IDs
        const companyIds = new Set<string>();
        const stationIds = new Set<string>();
        const modelIds   = new Set<string>();

        joined.forEach(p => {
          if (p.companyId) companyIds.add(p.companyId);
          p.stationTargets?.forEach(st => st?.stationId && stationIds.add(st.stationId));
          p.modelDiscounts?.forEach(md => md?.modelId && modelIds.add(md.modelId));
        });

        // 3) Load meta song song
        const [companyMap, stationMap, modelMap] = await Promise.all([
          loadCompaniesByIds([...companyIds], companyCollectionName),
          loadStationsByIds([...stationIds], stationCollectionName),
          loadVehicleModelsByIds([...modelIds], vehicleModelCollectionName),
        ]);
        if (!mounted) return;

        // 4) Build OPTIONS nhanh (Map → Array)
        const _companyOptions: Option[] = [...companyMap.values()].map(c => ({ value: c.id, label: c.name })).sort((a,b)=>a.label.localeCompare(b.label,'vi'));
        const _stationById = new Map<string, Option>();
        stationMap.forEach((s, id) => _stationById.set(id, { value: id, label: s.name }));
        const _modelOptions: Option[] = [...modelMap.values()].map(m => ({ value: m.id!, label: (m as unknown as AnyRec).name as string || m.id! }))
          .sort((a,b)=>a.label.localeCompare(b.label,'vi'));
        const _programOptions: Option[] = joined.map(p => ({ value: (p as unknown as AnyRec).id as string, label: p.title || (p as unknown as AnyRec).id as string }));

        // 5) Dựng “station theo company” từ programs (nhanh & đủ cho options)
        const _stationByCompany = new Map<string, Option[]>();
        joined.forEach(p => {
          if (!p.companyId) return;
          const arr = _stationByCompany.get(p.companyId) || [];
          const seen = new Set(arr.map(o=>o.value));
          p.stationTargets?.forEach(st => {
            const opt = _stationById.get(st.stationId);
            if (opt && !seen.has(opt.value)) { arr.push(opt); seen.add(opt.value); }
          });
          if (arr.length) _stationByCompany.set(p.companyId, arr.sort((a,b)=>a.label.localeCompare(b.label,'vi')));
        });

        setCompanyOptions(_companyOptions);
        setStationOptionsById(_stationById);
        setStationOptionsByCompany(_stationByCompany);
        setModelOptions(_modelOptions);
        setProgramOptions(_programOptions);
        setLoading(false);
      } catch (e:any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load options');
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [agentId, vehicleModelCollectionName, companyCollectionName, stationCollectionName]);

  // helper: lấy station options theo company (ưu tiên trạm chỉ định trong programs); fallback: trống (hoặc bạn có thể nạp thêm tất cả trạm theo công ty nếu muốn)
  const getStationOptionsForCompany = (companyId?: string | null): Option[] => {
    if (!companyId) return [];
    return stationOptionsByCompany.get(companyId) || [];
  };

  return {
    loading, error,
    programs,                   // dữ liệu thô (nếu cần)
    companyOptions,             // [{value,label}]
    programOptions,             // [{value,label}]
    modelOptions,               // [{value,label}]
    getStationOptionsForCompany // (companyId) => [{value,label}]
  };
}
