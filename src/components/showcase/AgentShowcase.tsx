'use client';

// Date : 16/09/2025
// AgentShowcase — phiên bản rút gọn (không header) + safe for guests

import * as React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, query, where, documentId, Query, QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import { useTranslation } from 'react-i18next';

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType';
import type { VehicleModel, FuelType } from '@/src/lib/vehicle-models/vehicleModelTypes';
import type { Vehicle, VehicleStatus } from '@/src/lib/vehicles/vehicleTypes';

/* ===== Brand color ===== */
const BRAND = '#00d289';

/* ===== Default icons ===== */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png';
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png';
import carIcon from '@/public/assets/images/vehicles/car.png';
import vanIcon from '@/public/assets/images/vehicles/van.png';
import busIcon from '@/public/assets/images/vehicles/bus.png';

const DEFAULT_ICONS: Record<string, StaticImageData> = {
  bike: bicycleIcon,
  motorbike: motorbikeIcon,
  car: carIcon,
  van: vanIcon,
  bus: busIcon,
};

/* ===================== Helpers ===================== */
function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const safeToMillis = (t?: any): number | null => {
  try { const ms = t?.toMillis?.(); return typeof ms === 'number' ? ms : null; } catch { return null; }
};
function isProgramActiveNow(p: Program): boolean {
  const now = Date.now();
  const s = safeToMillis((p as any).startDate);
  const e = safeToMillis((p as any).endDate);
  return !((s && s > now) || (e && e < now)) && p.isActive !== false;
}
function formatVND(n?: number | null): string {
  if (n == null) return '—';
  try { return new Intl.NumberFormat('vi-VN').format(n) + '₫'; } catch { return `${n}₫`; }
}
/** Google Drive share/view → direct served URL */
function getDirectDriveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = m1?.[1] || m2?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}

/* ===== Chuẩn hoá vehicleType ===== */
type CanonType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';
function normalizeVehicleType(input?: string): CanonType {
  const s = (input || '').trim().toLowerCase();
  if (!s) return 'other';
  if (['bicycle', 'bike', 'ebike', 'cycle', 'xe đạp'].includes(s)) return 'bike';
  if (['motorbike', 'moto', 'motor', 'scooter', 'motorcycle', 'xe máy', 'xe tay ga'].includes(s)) return 'motorbike';
  if (['car', 'sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'xe hơi', 'ô tô'].includes(s)) return 'car';
  if (['van', 'minivan', 'limo', 'limousine'].includes(s)) return 'van';
  if (['bus', 'coach'].includes(s)) return 'bus';
  if ((['bike','motorbike','car','van','bus'] as string[]).includes(s)) return s as CanonType;
  return 'other';
}
function resolveModelImage(vm: VehicleModel): string | StaticImageData {
  const direct = getDirectDriveImageUrl(vm.imageUrl);
  if (direct) return direct;
  const key = normalizeVehicleType(vm.vehicleType);
  return DEFAULT_ICONS[key] ?? DEFAULT_ICONS.bike;
}

/* ===== Coerce modelDiscounts ===== */
function coerceModelDiscounts(raw: any): ProgramModelDiscount[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((it: any) => typeof it?.modelId === 'string');
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([modelId, v]) => ({
      modelId,
      discountType: (v as any)?.discountType || 'fixed',
      discountValue: Number((v as any)?.discountValue || 0),
    }));
  }
  return [];
}

/* ===================== Safe Firestore helpers ===================== */
async function safeGetDocs<T = any>(q: Query<T>) {
  try {
    const snap = await getDocs(q);
    return snap;
  } catch (e) {
    // permission-denied hoặc lỗi mạng… → trả về snap giả rỗng
    // console.warn('[AgentShowcase] getDocs failed:', e);
    return { docs: [] } as any;
  }
}

/* ===== Firestore loaders (safe for guests) ===== */
async function loadJoinedPrograms(agentId: string) {
  try {
    const snap = await safeGetDocs(
      query(
        collection(db, 'programParticipants'),
        where('userId', '==', agentId),
        where('userRole', '==', 'agent'),
        where('status', '==', 'joined')
      )
    );
    const programIds = Array.from(new Set((snap.docs || []).map((d: { data: () => any; }) => (d.data() as any)?.programId).filter(Boolean)));
    if (!programIds.length) return [];

    const all: (Program & { modelDiscounts: ProgramModelDiscount[]; companyId?: string | null })[] = [];
    for (const part of chunk(programIds, 10)) {
      const ps = await safeGetDocs(query(collection(db, 'programs'), where(documentId(), 'in', part)));
      (ps.docs || []).forEach((d: { id: any; data: () => any; }) => all.push({
        id: d.id,
        ...(d.data() as any),
        modelDiscounts: coerceModelDiscounts((d.data() as any)?.modelDiscounts),
        companyId: (d.data() as any)?.companyId || null,
      }));
    }
    return all.filter(isProgramActiveNow).filter(p => p.modelDiscounts.length > 0);
  } catch {
    return [];
  }
}

async function loadVehicleModelsByIds(ids: string[], collectionName: string) {
  const map = new Map<string, VehicleModel>();
  if (!ids.length) return map;
  for (const part of chunk(ids, 10)) {
    try {
      const snap = await safeGetDocs(query(collection(db, collectionName), where(documentId(), 'in', part)));
      (snap.docs || []).forEach((d: { id: string; data: () => any; }) => map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel));
    } catch {
      // ignore
    }
  }
  return map;
}

async function loadVehiclesFor(
  companyIds: string[],
  modelIds: string[],
  vehicleCollectionName: string,
  statusFilter?: VehicleStatus
): Promise<Vehicle[]> {
  const results: Vehicle[] = [];
  if (!companyIds.length || !modelIds.length) return results;

  for (const companyId of companyIds) {
    for (const part of chunk(modelIds, 10)) {
      try {
        const conds: QueryConstraint[] = [
          where('companyId', '==', companyId),
          where('modelId', 'in', part),
        ];
        if (statusFilter) conds.push(where('status', '==', statusFilter));
        const q = query(collection(db, vehicleCollectionName), ...conds);
        const snap = await safeGetDocs(q);
        (snap.docs || []).forEach((d: { id: any; data: () => any; }) => results.push({ id: d.id, ...(d.data() as any) } as Vehicle));
      } catch {
        // ignore
      }
    }
  }
  return results;
}

/* ===================== View types ===================== */
type ModelCardRow = {
  key: string;
  model: VehicleModel;
  baseFrom: number | null;
  vehicleCount: number;
  preferredCompanyId?: string;
  preferredStationId?: string;
  preferredVehicleId?: string;
};

interface ShowcaseProps {
  agentId: string;
  vehicleModelCollectionName?: string;
  vehiclesCollectionName?: string;
  limitPerRow?: number;
  onlyAvailable?: boolean;
}

export default function AgentShowcase({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  vehiclesCollectionName = 'vehicles',
  limitPerRow = 20,
  onlyAvailable = true,
}: ShowcaseProps) {
  const { t } = useTranslation('common', { useSuspense: false });
  const router = useRouter();

  const [rows, setRows] = React.useState<ModelCardRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [noticeOpen, setNoticeOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const programs = await loadJoinedPrograms(agentId);
        if (!mounted) return;

        if (!programs.length) {
          setRows([]);
          return;
        }

        const companyIds = Array.from(new Set(programs.map(p => p.companyId).filter(Boolean))) as string[];
        const modelIds = Array.from(new Set(programs.flatMap(p => p.modelDiscounts.map(md => md.modelId))));

        if (companyIds.length === 0 || modelIds.length === 0) {
          setRows([]);
          return;
        }

        const [modelMap, vehicles] = await Promise.all([
          loadVehicleModelsByIds(modelIds, vehicleModelCollectionName),
          loadVehiclesFor(companyIds, modelIds, vehiclesCollectionName, onlyAvailable ? 'Available' : undefined),
        ]);
        if (!mounted) return;

        const byModel = new Map<string, ModelCardRow>();
        vehicles.forEach(v => {
          const vm = modelMap.get(v.modelId);
          if (!vm) return;
          const base = typeof (v as any).pricePerDay === 'number' ? (v as any).pricePerDay : null;

          const cur = byModel.get(v.modelId);
          if (!cur) {
            byModel.set(v.modelId, {
              key: v.modelId,
              model: vm,
              baseFrom: base,
              vehicleCount: 1,
              preferredCompanyId: (v as any).companyId,
              preferredStationId: (v as any).stationId,
              preferredVehicleId: v.id,
            });
          } else {
            cur.vehicleCount += 1;
            if (base != null && (cur.baseFrom == null || base < cur.baseFrom)) {
              cur.baseFrom = base;
              cur.preferredCompanyId = (v as any).companyId;
              cur.preferredStationId = (v as any).stationId;
              cur.preferredVehicleId = v.id;
            }
          }
        });

        const built = Array.from(byModel.values());
        built.sort((a, b) => {
          const aBase = a.baseFrom ?? Infinity;
          const bBase = b.baseFrom ?? Infinity;
          if (aBase !== bBase) return aBase - bBase;
          return (a.model?.name || '').localeCompare(b.model?.name || '');
        });

        setRows(built);
      } catch (_err) {
        // an toàn cho khách: lỗi → coi như không có dữ liệu
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [agentId, vehicleModelCollectionName, vehiclesCollectionName, onlyAvailable, limitPerRow]);

  /* ==== BOOK action ==== */
  const handleBook = (r: ModelCardRow) => {
    const params = new URLSearchParams();
    params.set('modelId', r.model.id);
    if (r.preferredCompanyId) params.set('companyId', r.preferredCompanyId);
    if (r.preferredStationId) params.set('stationId', r.preferredStationId);
    if (r.preferredVehicleId) params.set('vehicleId', r.preferredVehicleId);
    if (r.baseFrom != null) params.set('basePricePerDay', String(r.baseFrom));
    params.set('source', 'agent_showcase');
    router.push(`/bookings/new?${params.toString()}`);
  };

  return (
    <section className="pt-0 pb-6">
      {/* Loading skeletons */}
      {loading && (
        <div className="-mx-4 overflow-x-auto">
          <div className="flex w-max gap-3 px-4 py-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={`sk-lite-${i}`} />)}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && rows.length > 0 && (
        <div className="-mx-4 overflow-x-auto">
          <div className="flex w-max gap-3 px-4 py-3">
            {rows.slice(0, limitPerRow).map((r) => (
              <div
                key={r.key}
                className="min-w-[78vw] max-w-[78vw] sm:min-w-[260px] sm:max-w-[260px] bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="bg-white rounded-t-2xl overflow-hidden">
                  <Image
                    src={resolveModelImage(r.model)}
                    alt={r.model.name}
                    width={640}
                    height={360}
                    className="w-full h-[44vw] max-h-[180px] object-contain bg-white"
                  />
                </div>

                <div className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 line-clamp-1">
                    {r.model.name}
                  </h4>

                  <div className="mt-1">
                    <span className="text-sm font-semibold" style={{ color: BRAND }}>
                      {formatVND(r.baseFrom)}{r.baseFrom != null ? ` ${t('agent_joined_models_showcase.per_day')}` : ''}
                    </span>
                  </div>

                  {/* Extra info grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 mt-2">
                    {r.model.brand && <div>🏷 {r.model.brand}</div>}
                    {r.model.fuelType && <div>⛽ {String(r.model.fuelType as FuelType)}</div>}
                    {typeof r.model.topSpeed === 'number' && <div>🚀 {r.model.topSpeed} km/h</div>}
                    {typeof r.model.range === 'number' && <div>📏 {r.model.range} km</div>}
                    {typeof r.model.maxLoad === 'number' && <div>🏋️ {r.model.maxLoad} kg</div>}
                    {typeof r.model.capacity === 'number' && <div>🪑 {r.model.capacity}</div>}
                  </div>

                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="greenOutline"
                      className="w-full px-4 py-2 text-sm font-semibold border"
                      style={{ color: BRAND, borderColor: BRAND }}
                      onClick={() => handleBook(r)}
                    >
                      {t('booking.book_now')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && (
        <div className="px-4 mt-6">
          <div className="rounded-2xl bg-white border p-6 text-sm text-gray-600 text-center">
            {t('agent_joined_models_showcase.empty')}
          </div>
        </div>
      )}

      <NotificationDialog
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        type="info"
        title={t('agent_joined_models_showcase.notification.title')}
        description={t('agent_joined_models_showcase.notification.description')}
      />
    </section>
  );
}
