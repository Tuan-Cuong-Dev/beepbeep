'use client'

/**
 * AgentJoinedModelsShowcase (refactor)
 * - Chỉ hiển thị mẫu xe thuộc các chương trình Agent đã JOIN.
 * - Header thương hiệu tối giản (#00d289): logo + tên + tổng mẫu.
 * - Nhóm & render động theo VehicleType: bike/bicycle, motorbike, car, van, bus, other.
 * - Ảnh hỗ trợ Google Drive → direct (uc?export=view&id=...).
 * - Mobile-first, thẻ cuộn ngang, chỉ render nhóm nếu có xe.
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

/* ===== Brand color ===== */
const BRAND = '#00d289'

/* ===== Default icons theo VehicleType ===== */
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
  try {
    const ms = t?.toMillis?.()
    return typeof ms === 'number' ? ms : null
  } catch {
    return null
  }
}
function isProgramActiveNow(p: Program): boolean {
  const now = Date.now()
  const s = safeToMillis((p as any).startDate)
  const e = safeToMillis((p as any).endDate)
  return !((s && s > now) || (e && e < now)) && p.isActive !== false
}
function applyDiscount(base: number | null, md?: ProgramModelDiscount | null): number | null {
  if (base == null) return null
  if (!md) return base
  if (md.discountType === 'fixed') return Math.max(0, Number(md.discountValue ?? base))
  if (md.discountType === 'percentage') return Math.max(0, Math.round((base * (100 - Number(md.discountValue || 0))) / 100))
  return base
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

/** Ưu tiên imageUrl → default icon theo type */
function resolveModelImage(vm: VehicleModel): string | StaticImageData {
  const direct = getDirectDriveImageUrl(vm.imageUrl)
  if (direct) return direct
  // gộp bicycle → bike để map icon
  const key = vm.vehicleType === 'bicycle' ? 'bike' : vm.vehicleType
  return DEFAULT_ICONS[key] || motorbikeIcon
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
function normalizeProgram(raw: any): Program & { modelDiscounts: ProgramModelDiscount[] } {
  const modelDiscounts = coerceModelDiscounts(raw?.modelDiscounts, raw)
  return { ...(raw as Program), modelDiscounts }
}

/* ===== Firestore ===== */
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
  const all: (Program & { modelDiscounts: ProgramModelDiscount[] })[] = []
  for (const part of chunk(programIds, 10)) {
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', part)))
    ps.docs.forEach(d => all.push(normalizeProgram({ id: d.id, ...(d.data() as any) })))
  }
  return all.filter(isProgramActiveNow).filter(p => p.modelDiscounts.length > 0)
}
async function loadVehicleModelsByIds(ids: string[], vehicleModelCollectionName: string) {
  const map = new Map<string, VehicleModel>()
  if (!ids.length) return map
  for (const part of chunk(ids, 10)) {
    const snap = await getDocs(query(collection(db, vehicleModelCollectionName), where(documentId(), 'in', part)))
    snap.docs.forEach(d => map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel))
  }
  return map
}

/* ===== Agent brand info (tối giản) ===== */
type AgentBrandInfo = {
  name: string
  logoUrl?: string
  rating?: number
}
function resolveBrandUrl(url?: string) {
  return getDirectDriveImageUrl(url) || url
}
async function loadAgentBrandInfo(agentId: string): Promise<AgentBrandInfo> {
  // agents/{agentId}
  const agentRef = doc(db, 'agents', agentId)
  const agentSnap = await getDoc(agentRef)
  if (agentSnap.exists()) {
    const d = agentSnap.data() as any
    return {
      name: d.name || d.displayName || 'Agent',
      logoUrl: resolveBrandUrl(d.logoUrl || d.avatarUrl),
      rating: typeof d.rating === 'number' ? d.rating : undefined,
    }
  }
  // users/{agentId}
  const userRef = doc(db, 'users', agentId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    const d = userSnap.data() as any
    return {
      name: d.displayName || d.name || 'Agent',
      logoUrl: resolveBrandUrl(d.photoURL || d.avatarUrl),
      rating: typeof d.rating === 'number' ? d.rating : undefined,
    }
  }
  return { name: 'Agent' }
}

/* ===== View types ===== */
type CardRow = {
  key: string
  programTitle: string
  model: VehicleModel
  finalPrice: number | null
  basePerDay: number | null
}

interface ShowcaseProps {
  agentId: string
  vehicleModelCollectionName?: string
  limitPerRow?: number
}

export default function AgentJoinedModelsShowcase({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  limitPerRow = 20,
}: ShowcaseProps) {
  const { t } = useTranslation('common', { useSuspense: false })
  const router = useRouter()

  const [rows, setRows] = React.useState<CardRow[]>([])
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

        const modelIds = Array.from(new Set(programs.flatMap(p => p.modelDiscounts.map(md => md.modelId))))
        const modelMap = await loadVehicleModelsByIds(modelIds, vehicleModelCollectionName)
        if (!mounted) return

        const built: CardRow[] = []
        programs.forEach(p => {
          p.modelDiscounts.forEach(md => {
            const vm = modelMap.get(md.modelId)
            if (!vm) return
            const basePerDay = typeof vm.pricePerDay === 'number' ? vm.pricePerDay : null
            const finalPrice = applyDiscount(basePerDay, md)
            built.push({
              key: `${p.id}:${md.modelId}`,
              programTitle: p.title,
              model: vm,
              finalPrice,
              basePerDay,
            })
          })
        })

        // Ưu tiên giảm nhiều → tên
        built.sort((a, b) => {
          const aDisc = (a.basePerDay ?? Infinity) - (a.finalPrice ?? Infinity)
          const bDisc = (b.basePerDay ?? Infinity) - (b.finalPrice ?? Infinity)
          if (aDisc !== bDisc) return bDisc - aDisc
          return (a.model?.name || '').localeCompare(b.model?.name || '')
        })

        setRows(built)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [agentId, vehicleModelCollectionName])

  /* ==== Group động theo VehicleType (chỉ render khi có xe) ==== */
  const normalizeType = (t?: string) => (t === 'bicycle' ? 'bike' : (t || 'other'))
  const grouped = React.useMemo(() => {
    const g: Record<string, CardRow[]> = {}
    rows.forEach(r => {
      const k = normalizeType(r.model?.vehicleType)
      ;(g[k] ||= []).push(r)
    })
    return g
  }, [rows])

  const TYPE_ORDER = React.useMemo(() => ([
    { key: 'bike',      label: t('vehicle.bike', 'Xe đạp') },
    { key: 'motorbike', label: t('vehicle.motorbike', 'Xe máy') },
    { key: 'car',       label: t('vehicle.car', 'Ô tô') },
    { key: 'van',       label: t('vehicle.van', 'Van / Limo') },
    { key: 'bus',       label: t('vehicle.bus', 'Xe bus') },
    { key: 'other',     label: t('vehicle.other', 'Khác') },
  ]), [t])

  /* ==== Compact brand header (gọn nhất có thể) ==== */
  const CompactBrandHeader = () => {
    const name = brand?.name || 'Agent'
    const logo = brand?.logoUrl
    const total = rows.length
    const rating = brand?.rating

    return (
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg border-2 overflow-hidden" style={{ borderColor: BRAND }}>
            {logo ? (
              <Image src={logo} alt={`${name} logo`} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: BRAND }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold truncate" style={{ color: BRAND }}>{name}</h2>
              {typeof rating === 'number' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">⭐ {rating.toFixed(1)}</span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${BRAND}1A`, color: BRAND }}>
              {t('agent_joined_models.available_models', '{{n}} mẫu', { n: total })}
            </span>
          </div>
        </div>
      </div>
    )
  }

  /* ==== Section (thẻ cuộn ngang) ==== */
  const Section = ({ title, data }: { title: string; data: CardRow[] }) => (
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
              <div className="cursor-pointer" onClick={() => router.push(`/vehicle-models/${r.model.id}`)}>
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
              </div>

              <div className="p-4">
                <h4 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {r.model.name}
                </h4>

                {/* Giá theo ngày */}
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND }}>
                    {formatVND(r.finalPrice)}{r.finalPrice != null ? '/ngày' : ''}
                  </span>
                  {r.basePerDay != null &&
                    r.finalPrice != null &&
                    r.finalPrice !== r.basePerDay && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatVND(r.basePerDay)}/ngày
                      </span>
                  )}
                </div>

                {/* Mô tả CTKM */}
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{r.programTitle}</p>

                {/* Thông số: brand, fuelType, topSpeed, range, maxLoad, capacity */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 mt-2">
                  {r.model.brand && <div>🏷 {r.model.brand}</div>}
                  {r.model.fuelType && <div>⛽ {String(r.model.fuelType as FuelType)}</div>}
                  {typeof r.model.topSpeed === 'number' && <div>🚀 {r.model.topSpeed} km/h</div>}
                  {typeof r.model.range === 'number' && <div>📏 {r.model.range} km</div>}
                  {typeof r.model.maxLoad === 'number' && <div>🏋️ {r.model.maxLoad} kg</div>}
                  {typeof r.model.capacity === 'number' && <div>🪑 {r.model.capacity} chỗ</div>}
                </div>

                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="greenOutline"
                    className="w-full px-4 py-2 text-sm font-semibold border"
                    style={{ color: BRAND, borderColor: BRAND }}
                    onClick={() => setNoticeOpen(true)}
                  >
                    {t('vehicleModelSection.rent_button', 'Thuê ngay')}
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
      {/* Header thương hiệu tối giản */}
      <CompactBrandHeader />

      {/* Skeleton hàng tổng quát khi chưa biết nhóm */}
      {loading && (
        <div className="max-w-7xl mx-auto mt-4 -mx-4 overflow-x-auto">
          <div className="flex w-max gap-3 px-4 py-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={`sk-top-${i}`} />)}
          </div>
        </div>
      )}

      {/* Nhóm & render động theo VehicleType (chỉ render nhóm có xe) */}
      {!loading && (
        <div className="max-w-7xl mx-auto">
          {TYPE_ORDER.map(({ key, label }) => {
            const data = grouped[key] || []
            return data.length > 0 ? (
              <Section key={key} title={label} data={data} />
            ) : null
          })}

          {/* Fallback khi không có bất kỳ nhóm nào */}
          {Object.values(grouped).every((arr) => (arr?.length || 0) === 0) && (
            <div className="px-4 mt-6">
              <div className="rounded-2xl bg-white border p-6 text-sm text-gray-600">
                {t('agent_joined_models.empty', 'Bạn chưa tham gia chương trình nào có mẫu xe.')}
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
