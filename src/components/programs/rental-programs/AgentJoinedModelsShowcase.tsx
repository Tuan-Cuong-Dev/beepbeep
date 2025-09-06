'use client'

/**
 * AgentJoinedModelsShowcase
 * - Chỉ hiển thị VehicleModels thuộc các Program mà agent đã JOINED
 * - Header thương hiệu agent: 1 màu #00d289, không hiển thị trạm áp dụng
 * - Ảnh: Google Drive → direct | default icon theo vehicleType | SVG placeholder
 */

import * as React from 'react'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
  getDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/src/firebaseConfig'
import { Button } from '@/src/components/ui/button'
import SkeletonCard from '@/src/components/skeletons/SkeletonCard'
import { useTranslation } from 'react-i18next'

import type {
  Program,
  ProgramModelDiscount,
} from '@/src/lib/programs/rental-programs/programsType'
import type { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes'

/* ======= Default icons (nhóm theo yêu cầu) ======= */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png'
import busIcon from '@/public/assets/images/vehicles/bus.png'
import carIcon from '@/public/assets/images/vehicles/car.png'
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png'
import vanIcon from '@/public/assets/images/vehicles/van.png'

/* ======= SVG placeholder ======= */
const placeholderIcon =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="none">
  <rect width="320" height="180" rx="12" fill="#F7F7F7"/>
  <path d="M60 120H260L245 85H75L60 120Z" stroke="#00d289" stroke-width="3" fill="none"/>
  <circle cx="100" cy="120" r="7" fill="#00d289"/>
  <circle cx="220" cy="120" r="7" fill="#00d289"/>
</svg>`)

/* ======= Config ======= */
const BRAND_COLOR = '#00d289'
const UNOPTIMIZED_IMAGE = false
const DEBUG = false
const log = (...a: any[]) => DEBUG && console.log('[AgentJoinedModelsShowcase]', ...a)

/* ======= Utils ======= */
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
function pickBasePrice(vm: VehicleModel): { label: string; value: number | null } {
  if (typeof vm.pricePerDay === 'number') return { label: 'ngày', value: vm.pricePerDay }
  if (typeof vm.pricePerHour === 'number') return { label: 'giờ', value: vm.pricePerHour }
  if (typeof vm.pricePerWeek === 'number') return { label: 'tuần', value: vm.pricePerWeek }
  if (typeof vm.pricePerMonth === 'number') return { label: 'tháng', value: vm.pricePerMonth }
  return { label: '', value: null }
}
function applyDiscount(base: number | null, md?: ProgramModelDiscount | null): number | null {
  if (base == null) return null
  if (!md) return base
  if (md.discountType === 'fixed') return Math.max(0, Number(md.discountValue ?? base))
  if (md.discountType === 'percentage')
    return Math.max(0, Math.round((base * (100 - Number(md.discountValue || 0))) / 100))
  return base
}
function formatVND(n?: number | null): string {
  if (n == null) return '—'
  try {
    return new Intl.NumberFormat('vi-VN').format(n) + '₫'
  } catch {
    return `${n}₫`
  }
}

/* ======= Drive URL → direct content ======= */
function toDriveDirect(url?: string): string | undefined {
  if (!url) return undefined
  const m = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/)
  if (!m) return url
  const id = m[1]
  return `https://drive.usercontent.google.com/uc?id=${id}&export=view`
}

/* ======= Default icons mapping ======= */
const DEFAULT_ICONS: Record<string, StaticImageData> = {
  bike: bicycleIcon,
  bicycle: bicycleIcon,
  motorbike: motorbikeIcon,
  car: carIcon,
  van: vanIcon,
  bus: busIcon,
}

/* ======= Ảnh model: Drive → direct | default | placeholder ======= */
function resolveModelImage(vm: VehicleModel): string | StaticImageData {
  return toDriveDirect(vm.imageUrl) || DEFAULT_ICONS[vm.vehicleType] || placeholderIcon
}

/* ======= Normalize modelDiscounts (đa schema) ======= */
function coerceModelDiscounts(raw: any, rawDoc?: any): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = []
  const push = (modelId: any, discountType?: any, discountValue?: any, ctx?: any) => {
    const id =
      (typeof modelId === 'string' && modelId) ||
      modelId?.modelId ||
      modelId?.vehicleModelId ||
      modelId?.id ||
      modelId?.model?.id ||
      modelId?.modelRef?.id
    if (!id) return
    let type: 'fixed' | 'percentage' | undefined = discountType
    let val = Number(discountValue)
    if (!type) {
      if (typeof (ctx?.percentage ?? ctx?.pct ?? ctx?.off) === 'number') {
        type = 'percentage'
        val = Number(ctx.percentage ?? ctx.pct ?? ctx.off)
      } else if (typeof (ctx?.finalPrice ?? ctx?.price ?? ctx?.fixed) === 'number') {
        type = 'fixed'
        val = Number(ctx.finalPrice ?? ctx.price ?? ctx.fixed)
      } else if (typeof ctx?.value === 'number' && (ctx?.type === 'percentage' || ctx?.type === 'fixed')) {
        type = ctx.type
        val = Number(ctx.value)
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'
        val = Number(ctx)
      }
    }
    if (type !== 'fixed' && type !== 'percentage') type = 'fixed'
    if (Number.isNaN(val)) val = 0
    out.push({ modelId: id, discountType: type, discountValue: val })
  }

  if (Array.isArray(raw)) {
    raw.forEach((it) => {
      if (typeof it === 'string') return push(it, 'fixed', 0, it)
      if (it && typeof it === 'object') return push(it, it.discountType, it.discountValue, it)
    })
    return out
  }
  if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') return push(k, undefined, undefined, v)
      if (v && typeof v === 'object') return push({ modelId: k }, (v as any).discountType, (v as any).discountValue, v)
    })
    if (!out.length) {
      const fb = (rawDoc && (rawDoc.models || rawDoc.vehicleModels)) || []
      if (Array.isArray(fb) && fb.length) fb.forEach((x) => push(x, 'fixed', 0, x))
    }
    return out
  }
  return out
}

function normalizeProgram(
  raw: any
): Program & {
  modelDiscounts: ProgramModelDiscount[]
  stationTargets: { stationId: string }[]
} {
  const modelDiscounts = coerceModelDiscounts(raw?.modelDiscounts, raw)
  const stationTargets = Array.isArray(raw?.stationTargets)
    ? raw.stationTargets.filter((x: any) => x && typeof x.stationId === 'string')
    : []
  return { ...(raw as Program), modelDiscounts, stationTargets }
}

/* ======= Loaders ======= */
async function loadJoinedPrograms(agentId: string) {
  const snap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  )
  const programIds = Array.from(
    new Set(snap.docs.map((d) => (d.data() as any)?.programId).filter(Boolean))
  )
  if (!programIds.length) return []

  const all: (Program & {
    modelDiscounts: ProgramModelDiscount[]
    stationTargets: { stationId: string }[]
  })[] = []
  for (const part of chunk(programIds, 10)) {
    const ps = await getDocs(
      query(collection(db, 'programs'), where(documentId(), 'in', part))
    )
    ps.docs.forEach((d) => all.push(normalizeProgram({ id: d.id, ...(d.data() as any) })))
  }
  return all.filter(isProgramActiveNow).filter((p) => p.modelDiscounts.length > 0)
}

async function loadVehicleModelsByIds(ids: string[], collectionName: string) {
  const map = new Map<string, VehicleModel>()
  if (!ids.length) return map
  for (const part of chunk(ids, 10)) {
    const snap = await getDocs(
      query(collection(db, collectionName), where(documentId(), 'in', part))
    )
    snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel))
  }
  return map
}

/* ======= Agent profile ======= */
type AgentProfile = {
  name?: string
  avatarUrl?: string
  tagline?: string
}
async function loadAgentProfile(agentId: string, collectionName = 'users'): Promise<AgentProfile> {
  try {
    const snap = await getDoc(doc(db, collectionName, agentId))
    if (!snap.exists()) return {}
    const d: any = snap.data()
    return {
      name: d?.companyName || d?.displayName || d?.name,
      avatarUrl: d?.photoURL || d?.avatarUrl,
      tagline: d?.tagline || d?.bio || '',
    }
  } catch {
    return {}
  }
}

/* ======= Types & Props ======= */
type CardRow = {
  key: string
  programTitle: string
  model: VehicleModel
  finalPrice: number | null
  basePriceLabel: string
  basePriceValue: number | null
}

interface ShowcaseProps {
  agentId: string
  vehicleModelCollectionName?: string
  /** hiển thị tối đa N thẻ; bỏ trống = tất cả */
  limit?: number
  /** override header nếu muốn */
  agentHeader?: {
    name?: string
    avatarUrl?: string
    tagline?: string
  }
  agentProfileCollectionName?: string
}

/* ======= Ảnh model cell (fallback) ======= */
function ModelImage({ vm }: { vm: VehicleModel }) {
  const [src, setSrc] = React.useState<string | StaticImageData>(() => resolveModelImage(vm))
  return (
    <div className="bg-white rounded-t-2xl overflow-hidden">
      <Image
        src={src}
        alt={vm.name || vm.modelCode || vm.id}
        width={320}
        height={180}
        sizes="(max-width: 768px) 260px, 320px"
        className="object-contain w-full h-[180px] transition-transform duration-300 hover:scale-105"
        unoptimized={UNOPTIMIZED_IMAGE}
        onError={() => setSrc(placeholderIcon)}
        key={typeof src === 'string' ? src : vm.id + '-static'}
      />
    </div>
  )
}

/* ======= Header thương hiệu Agent (1 màu #00d289, không show “trạm”) ======= */
function AgentBrandHeader({
  name,
  avatarUrl,
  tagline,
  modelCount,
}: {
  name?: string
  avatarUrl?: string
  tagline?: string
  modelCount: number
}) {
  const avatar = toDriveDirect(avatarUrl) || '/favicon.ico'
  return (
    <div
      className="relative overflow-hidden rounded-xl text-white mb-5"
      style={{ backgroundImage: `linear-gradient(90deg, ${BRAND_COLOR}, ${BRAND_COLOR})` }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-[180%] h-[180%] -left-1/3 -top-1/2 absolute rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center gap-4 p-5 md:p-6">
        <div className="shrink-0">
          <Image
            src={avatar}
            alt={name || 'Agent'}
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl border border-white/30 object-cover bg-white/10"
            unoptimized={UNOPTIMIZED_IMAGE}
          />
        </div>

        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold">{name || 'Đối tác'}</h2>
          {tagline && <p className="text-sm md:text-base opacity-90">{tagline}</p>}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">
              🚘 {modelCount} mẫu xe khả dụng
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======================= Component ======================= */
export default function AgentJoinedModelsShowcase({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  limit,
  agentHeader,
  agentProfileCollectionName = 'users',
}: ShowcaseProps) {
  const { t } = useTranslation('common', { useSuspense: false })
  const router = useRouter()
  const [rows, setRows] = React.useState<CardRow[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [brand, setBrand] = React.useState<AgentProfile>({})

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)

        // Header: ưu tiên props → load từ users/{agentId}
        if (!agentHeader) {
          const prof = await loadAgentProfile(agentId, agentProfileCollectionName)
          if (mounted) setBrand(prof)
        } else {
          setBrand({
            name: agentHeader.name,
            avatarUrl: agentHeader.avatarUrl,
            tagline: agentHeader.tagline,
          })
        }

        // Programs đã join
        const programs = await loadJoinedPrograms(agentId)
        if (!mounted) return

        // gom modelIds → load vehicleModels
        const modelIds = Array.from(
          new Set(programs.flatMap((p) => p.modelDiscounts.map((md) => md.modelId)))
        )
        const modelMap = await loadVehicleModelsByIds(modelIds, vehicleModelCollectionName)
        if (!mounted) return

        const built: CardRow[] = []
          programs.forEach((p) => {
            p.modelDiscounts.forEach((md) => {
              const vm = modelMap.get(md.modelId)
              if (!vm) return

              // ✅ chỉ dùng giá bán lẻ theo ngày
              const basePerDay: number | null =
                typeof vm.pricePerDay === 'number' ? vm.pricePerDay : null

              const finalPrice = applyDiscount(basePerDay, md)

              built.push({
                key: `${p.id}:${md.modelId}`,
                programTitle: p.title,
                model: vm,
                finalPrice,
                basePriceLabel: basePerDay != null ? 'ngày' : '',
                basePriceValue: basePerDay,
              })
            })
          })

          // sort: ưu tiên giảm giá lớn hơn, rồi theo tên
          built.sort((a, b) => {
            const aDisc = (a.basePriceValue ?? Infinity) - (a.finalPrice ?? Infinity)
            const bDisc = (b.basePriceValue ?? Infinity) - (b.finalPrice ?? Infinity)
            if (aDisc !== bDisc) return bDisc - aDisc
            return (a.model?.name || '').localeCompare(b.model?.name || '')
          })


        // sort ưu tiên giảm giá rồi theo tên
        built.sort((a, b) => {
          const aDisc = (a.finalPrice ?? Infinity) - (a.basePriceValue ?? Infinity)
          const bDisc = (b.finalPrice ?? Infinity) - (b.basePriceValue ?? Infinity)
          if (aDisc !== bDisc) return aDisc - bDisc
          return (a.model?.name || '').localeCompare(b.model?.name || '')
        })

        setRows(typeof limit === 'number' ? built.slice(0, limit) : built)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [agentId, vehicleModelCollectionName, limit, agentHeader, agentProfileCollectionName])

  const modelCount = rows?.length ?? 0

  return (
    <section className="font-sans pt-4 pb-6 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header thương hiệu Agent (màu #00d289, không hiển thị trạm) */}
        <AgentBrandHeader
          name={agentHeader?.name ?? brand.name}
          avatarUrl={agentHeader?.avatarUrl ?? brand.avatarUrl}
          tagline={agentHeader?.tagline ?? brand.tagline}
          modelCount={modelCount}
        />

        <div className="overflow-x-auto">
          <div className="flex gap-4 w-max pb-2">
            {loading && [...Array(4)].map((_, i) => <SkeletonCard key={`sk-${i}`} />)}

            {!loading &&
              rows &&
              rows.length > 0 &&
              rows.map((r) => (
                <div
                  key={r.key}
                  className="min-w-[260px] max-w-[260px] flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/vehicle-models/${r.model.id}`)}>
                    <ModelImage vm={r.model} />
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                      {r.model.name}
                    </h3>

                    {/* Giá theo ngày */}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[#00d289] text-sm font-semibold">
                      {formatVND(r.finalPrice)}{r.basePriceLabel ? `/${r.basePriceLabel}` : ''}
                    </span>
                    {r.basePriceValue != null &&
                      r.finalPrice != null &&
                      r.finalPrice !== r.basePriceValue && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatVND(r.basePriceValue)}/ngày
                        </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {r.programTitle}
                  </p>

                  {/* Thông số theo yêu cầu */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 mt-2">
                    {r.model.brand && <div>🏷 {r.model.brand}</div>}
                    {r.model.fuelType && <div>⛽ {String(r.model.fuelType)}</div>}
                    {typeof r.model.topSpeed === 'number' && <div>🚀 {r.model.topSpeed} km/h</div>}
                    {typeof r.model.range === 'number' && <div>📏 {r.model.range} km</div>}
                    {typeof r.model.maxLoad === 'number' && <div>🏋️ {r.model.maxLoad} kg</div>}
                    {typeof r.model.capacity === 'number' && <div>🪑 {r.model.capacity} chỗ</div>}
                  </div>


                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="greenOutline"
                        className="w-full px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full"
                        onClick={() => router.push(`/vehicle-models/${r.model.id}`)}
                      >
                        {t('vehicleModelSection.rent_button', 'Thuê ngay')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            {!loading && (!rows || rows.length === 0) && (
              <div className="min-w-[260px] max-w-[260px] flex-shrink-0">
                <div className="rounded-2xl bg-white border p-6 text-sm text-gray-600">
                  {t('agent_joined_models.empty', 'Agent hiện chưa tham gia chương trình nào có mẫu xe.')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
