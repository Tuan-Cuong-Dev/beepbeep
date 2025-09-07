'use client'

/**
 * AgentJoinedModelsShowcase (dedupe-by-model, BASE price only) — BOOKING READY
 * - Hiển thị theo MODEL (gom các xe từ những Program agent đã JOIN).
 * - Giá hiển thị: baseFrom = MIN(vehicle.pricePerDay) (không áp KM).
 * - Nút hành động: Đặt xe → /bookings/new?modelId=...&companyId=...&stationId=...&vehicleId=...
 *   (prefill theo chiếc có giá/ngày thấp nhất tìm được).
 */

import * as React from 'react'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import {
  collection, getDocs, query, where, documentId, doc, getDoc,
} from 'firebase/firestore'
import { db } from '@/src/firebaseConfig'
import { Button } from '@/src/components/ui/button'
import NotificationDialog from '@/src/components/ui/NotificationDialog'
import SkeletonCard from '@/src/components/skeletons/SkeletonCard'
import { useTranslation } from 'react-i18next'

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType'
import type { VehicleModel, FuelType } from '@/src/lib/vehicle-models/vehicleModelTypes'
import type { Vehicle, VehicleStatus } from '@/src/lib/vehicles/vehicleTypes'

/* ===== Brand color ===== */
const BRAND = '#00d289'

/* ===== Default icons ===== */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png'
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png'
import carIcon from '@/public/assets/images/vehicles/car.png'
import vanIcon from '@/public/assets/images/vehicles/van.png'
import busIcon from '@/public/assets/images/vehicles/bus.png'

const DEFAULT_ICONS: Record<string, StaticImageData> = {
  bike: bicycleIcon,
  motorbike: motorbikeIcon,
  car: carIcon,
  van: vanIcon,
  bus: busIcon,
}

/* ===== Helpers ===== */
const DEBUG = false
const log = (...a: any[]) => DEBUG && console.log('[AgentJoinedModelsShowcase]', ...a)

function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
const safeToMillis = (t?: any): number | null => {
  try { const ms = t?.toMillis?.(); return typeof ms === 'number' ? ms : null } catch { return null }
}
function isProgramActiveNow(p: Program): boolean {
  const now = Date.now()
  const s = safeToMillis((p as any).startDate)
  const e = safeToMillis((p as any).endDate)
  return !((s && s > now) || (e && e < now)) && p.isActive !== false
}
function formatVND(n?: number | null): string {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('vi-VN').format(n) + '₫' } catch { return `${n}₫` }
}

/** Google Drive share/view → direct served URL */
function getDirectDriveImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  const id = m1?.[1] || m2?.[1]
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
}

/* ===== Chuẩn hoá vehicleType ===== */
type CanonType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other'
const TYPE_ORDER: CanonType[] = ['bike', 'motorbike', 'car', 'van', 'bus', 'other']

function normalizeVehicleType(input?: string): CanonType {
  const s = (input || '').trim().toLowerCase()
  if (!s) return 'other'
  if (['bicycle', 'bike', 'ebike', 'cycle', 'xe đạp'].includes(s)) return 'bike'
  if (['motorbike', 'moto', 'motor', 'scooter', 'motorcycle', 'xe máy', 'xe tay ga'].includes(s)) return 'motorbike'
  if (['car', 'sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'xe hơi', 'ô tô'].includes(s)) return 'car'
  if (['van', 'minivan', 'limo', 'limousine'].includes(s)) return 'van'
  if (['bus', 'coach'].includes(s)) return 'bus'
  if ((['bike','motorbike','car','van','bus'] as string[]).includes(s)) return s as CanonType
  return 'other'
}

/** Ưu tiên imageUrl → default icon theo type (đã chuẩn hoá) */
function resolveModelImage(vm: VehicleModel): string | StaticImageData {
  const direct = getDirectDriveImageUrl(vm.imageUrl)
  if (direct) return direct
  const key = normalizeVehicleType(vm.vehicleType)
  return DEFAULT_ICONS[key] ?? DEFAULT_ICONS.bike
}

/* ===== Coerce modelDiscounts (đa schema) ===== */
function coerceModelDiscounts(raw: any, rawDocForLog?: any): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = []
  const push = (modelId: any, discountType?: any, discountValue?: any, ctx?: any) => {
    const id =
      (typeof modelId === 'string' && modelId) ||
      modelId?.modelId || modelId?.vehicleModelId || modelId?.id ||
      modelId?.model?.id || modelId?.modelRef?.id
    if (!id) return
    let type: 'fixed' | 'percentage' | undefined = discountType
    let val = Number(discountValue)

    if (!type) {
      if (typeof (ctx?.percentage ?? ctx?.pct ?? ctx?.off) === 'number') {
        type = 'percentage'; val = Number(ctx.percentage ?? ctx.pct ?? ctx.off)
      } else if (typeof (ctx?.finalPrice ?? ctx?.price ?? ctx?.fixed) === 'number') {
        type = 'fixed'; val = Number(ctx.finalPrice ?? ctx.price ?? ctx.fixed)
      } else if (typeof ctx?.value === 'number' && (ctx?.type === 'percentage' || ctx?.type === 'fixed')) {
        type = ctx.type; val = Number(ctx.value)
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'; val = Number(ctx)
      }
    }
    if (type !== 'fixed' && type !== 'percentage') type = 'fixed'
    if (Number.isNaN(val)) val = 0
    out.push({ modelId: id, discountType: type, discountValue: val })
  }

  if (Array.isArray(raw)) {
    raw.forEach((it) => {
      if (typeof it === 'string') return push(it, 'fixed', 0, it)
      if (it && typeof it === 'object') return push(it, (it as any).discountType, (it as any).discountValue, it)
    })
    return out
  }
  if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') return push(k, undefined, undefined, v)
      if (v && typeof v === 'object') return push({ modelId: k }, (v as any).discountType, (v as any).discountValue, v)
    })
    if (!out.length) {
      const fb = (rawDocForLog && (rawDocForLog.models || rawDocForLog.vehicleModels)) || []
      if (Array.isArray(fb) && fb.length) fb.forEach((x) => push(x, 'fixed', 0, x))
    }
    return out
  }
  return out
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
  )
}

function normalizeProgram(raw: any): Program & {
  modelDiscounts: ProgramModelDiscount[]; companyId?: string | null; title?: string
} {
  const modelDiscounts = coerceModelDiscounts(raw?.modelDiscounts, raw)
  const companyId = extractCompanyId(raw)
  return { ...(raw as Program), modelDiscounts, companyId, title: (raw as any)?.title }
}

/* ===== Firestore loaders ===== */
async function loadJoinedPrograms(agentId: string) {
  const snap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  )
  const programIds = Array.from(new Set(snap.docs.map(d => (d.data() as any)?.programId).filter(Boolean)))
  if (!programIds.length) return []

  const all: (Program & { modelDiscounts: ProgramModelDiscount[]; companyId?: string | null; title?: string })[] = []
  for (const part of chunk(programIds, 10)) {
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', part)))
    ps.docs.forEach(d => all.push(normalizeProgram({ id: d.id, ...(d.data() as any) })))
  }
  return all.filter(isProgramActiveNow).filter(p => p.modelDiscounts.length > 0)
}

async function loadVehicleModelsByIds(ids: string[], collectionName: string) {
  const map = new Map<string, VehicleModel>()
  if (!ids.length) return map
  for (const part of chunk(ids, 10)) {
    const snap = await getDocs(query(collection(db, collectionName), where(documentId(), 'in', part)))
    snap.docs.forEach(d => map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel))
  }
  return map
}

async function loadVehiclesFor(
  companyIds: string[],
  modelIds: string[],
  vehicleCollectionName: string,
  statusFilter?: VehicleStatus
): Promise<Vehicle[]> {
  const results: Vehicle[] = []
  if (!companyIds.length || !modelIds.length) return results

  for (const companyId of companyIds) {
    for (const part of chunk(modelIds, 10)) {
      const conds: any[] = [
        where('companyId', '==', companyId),
        where('modelId', 'in', part),
      ]
      if (statusFilter) conds.push(where('status', '==', statusFilter))
      const q = query(collection(db, vehicleCollectionName), ...conds)
      const snap = await getDocs(q)
      snap.docs.forEach(d => results.push({ id: d.id, ...(d.data() as any) } as Vehicle))
    }
  }
  return results
}

/* ===== Agent brand info ===== */
type AgentBrandInfo = { name: string; logoUrl?: string; rating?: number; tagline?: string }
function resolveBrandUrl(url?: string) { return getDirectDriveImageUrl(url) || url }
async function loadAgentBrandInfo(agentId: string): Promise<AgentBrandInfo> {
  const agentRef = doc(db, 'agents', agentId)
  const agentSnap = await getDoc(agentRef)
  if (agentSnap.exists()) {
    const d = agentSnap.data() as any
    return {
      name: d.name || d.displayName || 'Agent',
      logoUrl: resolveBrandUrl(d.logoUrl || d.avatarUrl),
      rating: typeof d.rating === 'number' ? d.rating : undefined,
      tagline: d.tagline || d.slogan || undefined,
    }
  }
  const userRef = doc(db, 'users', agentId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    const d = userSnap.data() as any
    return {
      name: d.displayName || d.name || 'Agent',
      logoUrl: resolveBrandUrl(d.photoURL || d.avatarUrl),
      rating: typeof d.rating === 'number' ? d.rating : undefined,
      tagline: d.tagline || d.slogan || undefined,
    }
  }
  return { name: 'Agent' }
}

/* ===== View types ===== */
type ModelCardRow = {
  key: string
  model: VehicleModel
  baseFrom: number | null
  vehicleCount: number
  // ↓ Gợi ý cho Booking: chiếc có baseFrom thấp nhất
  preferredCompanyId?: string
  preferredStationId?: string
  preferredVehicleId?: string
}

interface ShowcaseProps {
  agentId: string
  vehicleModelCollectionName?: string
  vehiclesCollectionName?: string
  limitPerRow?: number
  onlyAvailable?: boolean
}

export default function AgentJoinedModelsShowcase({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  vehiclesCollectionName = 'vehicles',
  limitPerRow = 20,
  onlyAvailable = true,
}: ShowcaseProps) {
  const { t } = useTranslation('common', { useSuspense: false })
  const router = useRouter()

  const [rows, setRows] = React.useState<ModelCardRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [noticeOpen, setNoticeOpen] = React.useState(false)
  const [brand, setBrand] = React.useState<AgentBrandInfo | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [info, programs] = await Promise.all([
          loadAgentBrandInfo(agentId),
          loadJoinedPrograms(agentId),
        ])
        if (!mounted) return
        setBrand(info)

        const companyIds = Array.from(new Set(programs.map(p => p.companyId).filter(Boolean))) as string[]
        const modelIds = Array.from(new Set(programs.flatMap(p => p.modelDiscounts.map(md => md.modelId))))
        if (companyIds.length === 0 || modelIds.length === 0) { setRows([]); return }

        const [modelMap, vehicles] = await Promise.all([
          loadVehicleModelsByIds(modelIds, vehicleModelCollectionName),
          loadVehiclesFor(companyIds, modelIds, vehiclesCollectionName, onlyAvailable ? 'Available' : undefined),
        ])
        if (!mounted) return

        const byModel = new Map<string, ModelCardRow>()
        vehicles.forEach(v => {
          const vm = modelMap.get(v.modelId)
          if (!vm) return
          const base = typeof v.pricePerDay === 'number' ? v.pricePerDay : null

          const cur = byModel.get(v.modelId)
          if (!cur) {
            byModel.set(v.modelId, {
              key: v.modelId,
              model: vm,
              baseFrom: base,
              vehicleCount: 1,
              preferredCompanyId: v.companyId,
              preferredStationId: v.stationId,
              preferredVehicleId: v.id,
            })
          } else {
            cur.vehicleCount += 1
            if (base != null && (cur.baseFrom == null || base < cur.baseFrom)) {
              cur.baseFrom = base
              cur.preferredCompanyId = v.companyId
              cur.preferredStationId = v.stationId
              cur.preferredVehicleId = v.id
            }
          }
        })

        const built = Array.from(byModel.values())

        built.sort((a, b) => {
          const aBase = a.baseFrom ?? Infinity
          const bBase = b.baseFrom ?? Infinity
          if (aBase !== bBase) return aBase - bBase
          return (a.model?.name || '').localeCompare(b.model?.name || '')
        })

        setRows(built)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [agentId, vehicleModelCollectionName, vehiclesCollectionName, onlyAvailable, limitPerRow])

  /* ==== Group theo type (đÃ CHUẨN HOÁ) ==== */
  const grouped = React.useMemo(() => {
    const g: Record<CanonType, ModelCardRow[]> = { bike:[], motorbike:[], car:[], van:[], bus:[], other:[] }
    rows.forEach(r => {
      const k = normalizeVehicleType(r.model?.vehicleType)
      g[k].push(r)
    })
    return g
  }, [rows])

  /* ==== Header đẹp + stats ==== */
  const { totalModels, perTypeModels } = React.useMemo(() => {
    const totalModels = rows.length
    const perTypeModels: Record<CanonType, number> = { bike:0, motorbike:0, car:0, van:0, bus:0, other:0 }
    rows.forEach(r => { perTypeModels[normalizeVehicleType(r.model?.vehicleType)] += 1 })
    return { totalModels, perTypeModels }
  }, [rows])

  const StatChip = ({ emoji, label, value }: { emoji: string; label: string; value: number }) => (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap"
      style={{ borderColor: BRAND, color: BRAND, background: `${BRAND}0D` }}
    >
      <span>{emoji}</span>
      <span className="font-medium">{label}</span>
      <span className="opacity-70">· {value}</span>
    </span>
  )

  const EnhancedBrandHeader = () => {
    const name = brand?.name || 'Agent'
    const logo = brand?.logoUrl
    const rating = brand?.rating

    const typeMeta: Record<CanonType, { label: string; emoji: string }> = {
      bike:      { label: t('vehicle.bike', 'Xe đạp'),     emoji: '🚲' },
      motorbike: { label: t('vehicle.motorbike', 'Xe máy'), emoji: '🛵' },
      car:       { label: t('vehicle.car', 'Ô tô'),         emoji: '🚗' },
      van:       { label: t('vehicle.van', 'Van'),          emoji: '🚐' },
      bus:       { label: t('vehicle.bus', 'Xe bus'),       emoji: '🚌' },
      other:     { label: t('vehicle.other', 'Khác'),       emoji: '🚘' },
    }

    return (
      <div className="font-sans w-full">
        <div className="w-full h-[100px]" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #11e8a0 100%)` }} />
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="-mt-10 pb-3 flex items-end gap-3">
              <div className="relative w-16 h-16 rounded-xl ring-4 ring-white overflow-hidden bg-white border" style={{ borderColor: BRAND }}>
                {logo ? <Image src={logo} alt={`${name} logo`} fill className="object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: BRAND }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold truncate" style={{ color: BRAND }}>{name}</h1>
                  {typeof rating === 'number' && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      ⭐ {rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${BRAND}1A`, color: BRAND }}>
                  {t('agent_joined_models.available_models', '{{n}} mẫu', { n: totalModels })}
                </span>
              </div>
            </div>

            <div className="-mx-1 overflow-x-auto">
              <div className="flex gap-2 px-1 pb-2">
                <StatChip emoji="📦" label={t('vehicle.total_models', 'Tổng mẫu')} value={totalModels} />
                {TYPE_ORDER.map((k) =>
                  (perTypeModels[k] ?? 0) > 0 ? (
                    <StatChip key={k} emoji={typeMeta[k].emoji} label={`${typeMeta[k].label} (${t('vehicle.models', 'mẫu')})`} value={perTypeModels[k]} />
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ==== BOOK action ==== */
  const handleBook = (r: ModelCardRow) => {
    const params = new URLSearchParams()
    params.set('modelId', r.model.id)
    if (r.preferredCompanyId) params.set('companyId', r.preferredCompanyId)
    if (r.preferredStationId) params.set('stationId', r.preferredStationId)
    if (r.preferredVehicleId) params.set('vehicleId', r.preferredVehicleId)
    if (r.baseFrom != null) params.set('basePricePerDay', String(r.baseFrom))
    params.set('source', 'agent_showcase')
    router.push(`/bookings/new?${params.toString()}`)
  }

  /* ==== Section ==== */
  const Section = ({ title, data }: { title: string; data: ModelCardRow[] }) => (
    <div className="mt-4">
      <div className="px-4">
        <h3 className="text-lg font-semibold" style={{ color: BRAND }}>{title}</h3>
      </div>

      <div className="-mx-4 overflow-x-auto">
        <div className="flex w-max gap-3 px-4 py-3">
          {loading && [...Array(3)].map((_, i) => <SkeletonCard key={`sk-${title}-${i}`} />)}

          {!loading && data.length === 0 && null}

          {!loading && data.slice(0, limitPerRow).map((r) => (
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
                  priority={false}
                />
              </div>

              <div className="p-4">
                <h4 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {r.model.name}
                </h4>

                <div className="mt-1">
                  <span className="text-sm font-semibold" style={{ color: BRAND }}>
                    {formatVND(r.baseFrom)}{r.baseFrom != null ? '/ngày' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 mt-2">
                  {r.model.brand && <div>🏷 {r.model.brand}</div>}
                  {r.model.fuelType && <div>⛽ {String(r.model.fuelType as FuelType)}</div>}
                  {typeof r.model.topSpeed === 'number' && <div>🚀 {r.model.topSpeed} km/h</div>}
                  {typeof r.model.range === 'number' && <div>📏 {r.model.range} km</div>}
                  {typeof r.model.maxLoad === 'number' && <div>🏋️ {r.model.maxLoad} kg</div>}
                  {typeof r.model.capacity === 'number' && <div>🪑 {r.model.capacity} chỗ</div>}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{t('vehicle.available_count', '{{n}} xe khả dụng', { n: r.vehicleCount })}</span>
                </div>

                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="greenOutline"
                    className="w-full px-4 py-2 text-sm font-semibold border"
                    style={{ color: BRAND, borderColor: BRAND }}
                    onClick={() => handleBook(r)}
                  >
                    {t('booking.book_now', 'Đặt xe')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <section className="pt-0 pb-6">
      <EnhancedBrandHeader />

      {loading && (
        <div className="max-w-7xl mx-auto mt-4 -mx-4 overflow-x-auto">
          <div className="flex w-max gap-3 px-4 py-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={`sk-top-${i}`} />)}
          </div>
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto">
          {TYPE_ORDER.map((key) => {
            const labelMap: Record<CanonType, string> = {
              bike: t('vehicle.bike', 'Xe đạp'),
              motorbike: t('vehicle.motorbike', 'Xe máy'),
              car: t('vehicle.car', 'Ô tô'),
              van: t('vehicle.van', 'Van / Limo'),
              bus: t('vehicle.bus', 'Xe bus'),
              other: t('vehicle.other', 'Khác'),
            }
            const data = grouped[key] || []
            return data.length > 0 ? (
              <Section key={key} title={labelMap[key]} data={data} />
            ) : null
          })}

          {TYPE_ORDER.every((k) => (grouped[k]?.length || 0) === 0) && (
            <div className="px-4 mt-6">
              <div className="rounded-2xl bg-white border p-6 text-sm text-gray-600">
                {t('agent_joined_models.empty', 'Không có mẫu phù hợp trong các chương trình bạn đã tham gia.')}
              </div>
            </div>
          )}
        </div>
      )}

      <NotificationDialog
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        type="info"
        title={t('vehicleModelSection.notification_title', 'Thông báo')}
        description={t('vehicleModelSection.notification_description', 'Tính năng đang phát triển.')}
      />
    </section>
  )
}
