'use client';

// Date: 17/09/2025
// PrivateProviderShowcase — Show các model mà Private Provider (user cá nhân) đang cho thuê (không header)

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import { useTranslation } from 'react-i18next';

import type { VehicleModel, FuelType } from '@/src/lib/vehicle-models/vehicleModelTypes';
import type { Vehicle, VehicleStatus } from '@/src/lib/vehicles/vehicleTypes';

/* ===== Brand color ===== */
const BRAND = '#00d289';

/* ===== Default icons (string paths) ===== */
const DEFAULT_ICONS: Record<string, string> = {
  bike: '/assets/images/vehicles/bicycle.png',
  motorbike: '/assets/images/vehicles/motorbike.png',
  car: '/assets/images/vehicles/car.png',
  van: '/assets/images/vehicles/van.png',
  bus: '/assets/images/vehicles/bus.png',
};

/* ===== Helpers ===== */
function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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

/* ===== Resolve image (Vehicle → Model → Default) ===== */
function getVehiclePrimaryImage(v?: any): string | undefined {
  if (!v) return undefined;
  // các field thường gặp
  const candidates: any[] = [
    v.imageUrl,
    v.photoURL,
    v.thumbnailUrl,
    v.coverUrl,
    v.coverImage,
    v.mainImage,
    v?.images?.[0]?.url,
    v?.images?.[0],
    v?.photos?.[0]?.url,
    v?.photos?.[0],
    v?.gallery?.[0]?.url,
    v?.gallery?.[0],
    v?.media?.[0]?.url,
  ].filter(Boolean);

  for (const c of candidates) {
    const direct = getDirectDriveImageUrl(String(c));
    if (direct) return direct;
    if (typeof c === 'string') return c;
  }
  return undefined;
}

function resolveModelImage(vm: VehicleModel): string | undefined {
  const direct = getDirectDriveImageUrl(vm.imageUrl);
  if (direct) return direct;
  const key = normalizeVehicleType(vm.vehicleType);
  return DEFAULT_ICONS[key] ?? DEFAULT_ICONS.bike;
}

function resolveShowcaseImage(vm: VehicleModel, vehicle?: Vehicle): string {
  // 1) Ưu tiên ảnh từ vehicle (chiếc pref có giá thấp nhất)
  const fromVehicle = getVehiclePrimaryImage(vehicle);
  if (fromVehicle) return fromVehicle;

  // 2) fallback ảnh của model
  const fromModel = resolveModelImage(vm);
  if (fromModel) return fromModel;

  // 3) fallback default icon
  const key = normalizeVehicleType(vm.vehicleType);
  return DEFAULT_ICONS[key] ?? DEFAULT_ICONS.bike;
}

/* ===== Firestore loaders ===== */
async function loadVehiclesOfPrivateProvider(
  providerUserId: string,
  vehiclesCollectionName: string,
  statusFilter?: VehicleStatus
): Promise<Vehicle[]> {
  const condSets: any[][] = [
    [where('ownerUserId', '==', providerUserId)],
    [where('providerUserId', '==', providerUserId)],
    [where('userId', '==', providerUserId)],
  ];
  const resultsMap = new Map<string, Vehicle>();

  for (const baseConds of condSets) {
    const conds = [...baseConds];
    if (statusFilter) conds.push(where('status', '==', statusFilter));
    const q = query(collection(db, vehiclesCollectionName), ...conds);
    const snap = await getDocs(q);
    snap.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...(d.data() as any) } as Vehicle));
  }

  return Array.from(resultsMap.values());
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

/* ===== View types ===== */
type ModelCardRow = {
  key: string;
  model: VehicleModel;
  baseFrom: number | null;         // min pricePerDay của provider
  vehicleCount: number;            // tổng/khả dụng theo filter
  preferredCompanyId?: string;     // nếu vehicle có companyId thì pref kèm
  preferredStationId?: string;
  preferredVehicleId?: string;     // id xe có giá thấp nhất
  preferredVehicle?: Vehicle;      // giữ lại để lấy ảnh vehicle
};

interface ShowcaseProps {
  providerUserId: string;                // ✅ user id của Private Provider
  vehicleModelCollectionName?: string;
  vehiclesCollectionName?: string;
  limitPerRow?: number;
  onlyAvailable?: boolean;               // mặc định chỉ show xe Available
}

export default function PrivateProviderShowcase({
  providerUserId,
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
        // 1) Lấy tất cả xe thuộc Private Provider
        const vehicles = await loadVehiclesOfPrivateProvider(
          providerUserId,
          vehiclesCollectionName,
          onlyAvailable ? 'Available' : undefined
        );
        if (!mounted) return;

        if (!vehicles.length) {
          setRows([]);
          return;
        }

        // 2) Gom theo modelId + xác định baseFrom / preferredVehicle
        const byModel = new Map<string, { baseFrom: number | null; count: number; prefVehicle?: Vehicle }>();
        vehicles.forEach(v => {
          const modelId = (v as any).modelId;
          if (!modelId) return;

          const price = typeof (v as any).pricePerDay === 'number' ? (v as any).pricePerDay : null;
          const cur = byModel.get(modelId);
          if (!cur) {
            byModel.set(modelId, { baseFrom: price, count: 1, prefVehicle: price != null ? v : undefined });
          } else {
            cur.count += 1;
            if (price != null && (cur.baseFrom == null || price < cur.baseFrom)) {
              cur.baseFrom = price;
              cur.prefVehicle = v;
            }
          }
        });

        const modelIds = Array.from(byModel.keys());
        if (!modelIds.length) { setRows([]); return; }

        // 3) Load thông tin model
        const modelMap = await loadVehicleModelsByIds(modelIds, vehicleModelCollectionName);
        if (!mounted) return;

        const built: ModelCardRow[] = [];
        byModel.forEach((agg, modelId) => {
          const vm = modelMap.get(modelId);
          if (!vm) return;
          const pref = agg.prefVehicle as any;
          built.push({
            key: modelId,
            model: vm,
            baseFrom: agg.baseFrom ?? null,
            vehicleCount: agg.count,
            preferredCompanyId: pref?.companyId,
            preferredStationId: pref?.stationId,
            preferredVehicleId: pref?.id,
            preferredVehicle: pref, // giữ lại để ưu tiên ảnh vehicle
          });
        });

        // 4) Sort by base price then model name
        built.sort((a, b) => {
          const aBase = a.baseFrom ?? Infinity;
          const bBase = b.baseFrom ?? Infinity;
          if (aBase !== bBase) return aBase - bBase;
          return (a.model?.name || '').localeCompare(b.model?.name || '');
        });

        setRows(built);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [providerUserId, vehicleModelCollectionName, vehiclesCollectionName, onlyAvailable, limitPerRow]);

  /* ==== BOOK action ==== */
  const handleBook = (r: ModelCardRow) => {
    const params = new URLSearchParams();
    params.set('modelId', r.model.id);
    if (r.preferredCompanyId) params.set('companyId', r.preferredCompanyId);
    if (r.preferredStationId) params.set('stationId', r.preferredStationId as string);
    if (r.preferredVehicleId) params.set('vehicleId', r.preferredVehicleId);
    if (r.baseFrom != null) params.set('basePricePerDay', String(r.baseFrom));
    params.set('source', 'private_provider_showcase');
    router.push(`/bookings/new?${params.toString()}`);
  };

  return (
    <section className="pt-0 pb-6">
      {/* Loading skeletons */}
      {loading && (
        <div className="-mx-4 overflow-x-auto">
          <div className="flex w-max gap-3 px-4 py-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={`sk-pp-${i}`} />)}
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
                    src={resolveShowcaseImage(r.model, r.preferredVehicle)}
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

                  {/* Badge số xe khả dụng (hoặc tổng nếu onlyAvailable=false) */}
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: `${BRAND}0D`, color: BRAND }}
                      title={t('agent_joined_models_showcase.available_count', { n: r.vehicleCount })}
                    >
                      ● {t('agent_joined_models_showcase.available_count', { n: r.vehicleCount })}
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
