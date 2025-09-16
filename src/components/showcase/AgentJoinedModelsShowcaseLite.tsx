'use client';

// Đối với đối tượng là Agent thì chúng ta lấy các xe mà Agent đã tham gia chương trình
// Date : 16/09/2025

/**
 * AgentJoinedModelsShowcaseLite — phiên bản rút gọn (không header)
 * - Gom xe theo MODEL từ các chương trình agent đã tham gia (status=joined, active).
 * - Giá hiển thị: baseFrom = MIN(vehicle.pricePerDay) (không áp KM).
 * - Nút Đặt xe: /bookings/new?modelId=...&companyId=...&stationId=...&vehicleId=...
 */

import * as React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import { useTranslation } from 'react-i18next';

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType';
import type { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
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

/* ===== Helpers ===== */
const DEBUG = false;
const log = (...a: any[]) => DEBUG && console.log('[AgentJoinedModelsShowcaseLite]', ...a);

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

/** Ưu tiên imageUrl → default icon theo type (đã chuẩn hoá) */
function resolveModelImage(vm: VehicleModel): string | StaticImageData {
  const direct = getDirectDriveImageUrl(vm.imageUrl);
  if (direct) return direct;
  const key = normalizeVehicleType(vm.vehicleType);
  return DEFAULT_ICONS[key] ?? DEFAULT_ICONS.bike;
}

/* ===== Coerce modelDiscounts (đa schema) ===== */
function coerceModelDiscounts(raw: any, rawDocForLog?: any): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = [];
  const push = (modelId: any, discountType?: any, discountValue?: any, ctx?: any) => {
    const id =
      (typeof modelId === 'string' && modelId) ||
      modelId?.modelId || modelId?.vehicleModelId || modelId?.id ||
      modelId?.model?.id || modelId?.modelRef?.id;
    if (!id) return;
    let type: 'fixed' | 'percentage' | undefined = discountType;
    let val = Number(discountValue);

    if (!type) {
      if (typeof (ctx?.percentage ?? ctx?.pct ?? ctx?.off) === 'number') {
        type = 'percentage'; val = Number(ctx.percentage ?? ctx.pct ?? ctx.off);
      } else if (typeof (ctx?.finalPrice ?? ctx?.price ?? ctx?.fixed) === 'number') {
        type = 'fixed'; val = Number(ctx.finalPrice ?? ctx.price ?? ctx.fixed);
      } else if (typeof ctx?.value === 'number' && (ctx?.type === 'percentage' || ctx?.type === 'fixed')) {
        type = ctx.type; val = Number(ctx.value);
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'; val = Number(ctx);
      }
    }
    if (type !== 'fixed' && type !== 'percentage') type = 'fixed';
    if (Number.isNaN(val)) val = 0;
    out.push({ modelId: id, discountType: type, discountValue: val });
  };

  if (Array.isArray(raw)) {
    raw.forEach((it) => {
      if (typeof it === 'string') return push(it, 'fixed', 0, it);
      if (it && typeof it === 'object') return push(it, (it as any).discountType, (it as any).discountValue, it);
    });
    return out;
  }
  if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') return push(k, undefined, undefined, v);
      if (v && typeof v === 'object') return push({ modelId: k }, (v as any).discountType, (v as any).discountValue, v);
    });
    if (!out.length) {
      const fb = (rawDocForLog && (rawDocForLog.models || rawDocForLog.vehicleModels)) || [];
      if (Array.isArray(fb) && fb.length) fb.forEach((x) => push(x, 'fixed', 0, x));
    }
    return out;
  }
  return out;
}

/** extract companyId */
function extractCompanyId(raw: any): string | null {
  return (
    raw?.companyId ||
    raw?.organizerCompanyId ||
    raw?.providerCompanyId ||
    raw?.company?.id ||
    raw?.companyRef?.id ||
    null
  );
}

function normalizeProgram(raw: any): Program & {
  modelDiscounts: ProgramModelDiscount[]; companyId?: string | null; title?: string
} {
  const modelDiscounts = coerceModelDiscounts(raw?.modelDiscounts, raw);
  const companyId = extractCompanyId(raw);
  return { ...(raw as Program), modelDiscounts, companyId, title: (raw as any)?.title };
}

/* ===== Firestore loaders (y hệt bản full) ===== */
async function loadJoinedPrograms(agentId: string) {
  const snap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  );
  const programIds = Array.from(new Set(snap.docs.map(d => (d.data() as any)?.programId).filter(Boolean)));
  if (!programIds.length) return [];

  const all: (Program & { modelDiscounts: ProgramModelDiscount[]; companyId?: string | null; title?: string })[] = [];
  for (const part of chunk(programIds, 10)) {
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', part)));
    ps.docs.forEach(d => all.push(normalizeProgram({ id: d.id, ...(d.data() as any) })));
  }
  return all.filter(isProgramActiveNow).filter(p => p.modelDiscounts.length > 0);
}

async function loadVehicleModelsByIds(ids: string[], collectionName: string) {
  const map = new Map<string, VehicleModel>();
  if (!ids.length) return map;
  for (const part of chunk(ids, 10)) {
    const snap = await getDocs(query(collection(db, collectionName), where(documentId(), 'in', part)));
    snap.docs.forEach(d => map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel));
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
      const conds: any[] = [
        where('companyId', '==', companyId),
        where('modelId', 'in', part),
      ];
      if (statusFilter) conds.push(where('status', '==', statusFilter));
      const q = query(collection(db, vehicleCollectionName), ...conds);
      const snap = await getDocs(q);
      snap.docs.forEach(d => results.push({ id: d.id, ...(d.data() as any) } as Vehicle));
    }
  }
  return results;
}

/* ===== View types ===== */
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

export default function AgentJoinedModelsShowcaseLite({
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
        log('programs', programs);

        const companyIds = Array.from(new Set(programs.map(p => p.companyId).filter(Boolean))) as string[];
        const modelIds = Array.from(new Set(programs.flatMap(p => p.modelDiscounts.map(md => md.modelId))));
        if (companyIds.length === 0 || modelIds.length === 0) {
          if (mounted) setRows([]);
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
          const base = typeof v.pricePerDay === 'number' ? v.pricePerDay : null;

          const cur = byModel.get(v.modelId);
          if (!cur) {
            byModel.set(v.modelId, {
              key: v.modelId,
              model: vm,
              baseFrom: base,
              vehicleCount: 1,
              preferredCompanyId: v.companyId,
              preferredStationId: (v as any).stationId,
              preferredVehicleId: v.id,
            });
          } else {
            cur.vehicleCount += 1;
            if (base != null && (cur.baseFrom == null || base < cur.baseFrom)) {
              cur.baseFrom = base;
              cur.preferredCompanyId = v.companyId;
              cur.preferredStationId = (v as any).stationId;
              cur.preferredVehicleId = v.id;
            }
          }
        });

        const built = Array.from(byModel.values());
        // Sort theo giá tăng dần, rồi theo tên model
        built.sort((a, b) => {
          const aBase = a.baseFrom ?? Infinity;
          const bBase = b.baseFrom ?? Infinity;
          if (aBase !== bBase) return aBase - bBase;
          return (a.model?.name || '').localeCompare(b.model?.name || '');
        });

        if (mounted) setRows(built);
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
