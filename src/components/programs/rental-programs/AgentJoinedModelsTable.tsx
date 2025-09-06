'use client'

/**
 * AgentJoinedModelsTable — typed refactor + mobile cards
 * - Table (>= md) và Card (mobile) hiển thị:
 *   Cty • Trạm • Model • Ảnh • Giá/ngày (base) • Chiết khấu CTV • Khoảng cách
 * - Giá/ngày = MIN(vehicle.pricePerDay) theo (companyId, modelId, [stationId?])
 * - Ảnh ưu tiên VehicleModel.imageUrl (có convert Google Drive)
 * - Khoảng cách nếu truyền userLocation={lat,lng}
 */

import * as React from 'react'
import Image from 'next/image'
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore'
import { db } from '@/src/firebaseConfig'
import { useTranslation } from 'react-i18next'

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType'
import type { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes'
import type { Vehicle, VehicleStatus } from '@/src/lib/vehicles/vehicleTypes'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/src/components/ui/table'

/* ======================= Config & Utils ======================= */
const DEBUG = false
const log  = (...a: unknown[]) => DEBUG && console.log('[AgentJoinedModelsTable]', ...a)
const warn = (...a: unknown[]) => DEBUG && console.warn('[AgentJoinedModelsTable]', ...a)

type AnyRec = Record<string, unknown>
const isRecord = (x: unknown): x is AnyRec => typeof x === 'object' && x !== null

function chunk<T>(arr: T[], size = 10): T[][] {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}

const safeToMillis = (t?: unknown): number | null => {
  try {
    // @ts-expect-error Firestore Timestamp
    const ms = t?.toMillis?.()
    return typeof ms === 'number' ? ms : null
  } catch {
    return null
  }
}
function isProgramActiveNow(p: Program): boolean {
  const now = Date.now()
  const s = safeToMillis((p as unknown as AnyRec).startDate)
  const e = safeToMillis((p as unknown as AnyRec).endDate)
  return !((s && s > now) || (e && e < now)) && p.isActive !== false
}

function formatVND(n?: number | null): string {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('vi-VN').format(n) + '₫' } catch { return `${n}₫` }
}

function getDirectDriveImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  const id = m1?.[1] || m2?.[1]
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
}

function resolveModelImage(vm?: VehicleModel): string {
  const direct = getDirectDriveImageUrl(vm?.imageUrl)
  return direct || '/no-image.png'
}

/** Khoảng cách Haversine (km) */
type LatLng = { lat: number; lng: number }
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 = Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(s1 + s2))
  return R * c
}

/* ======================= Types ======================= */
type StationTargetLite = { stationId: string }

type CompanyLite = { id: string; name: string }
type StationMeta = { id: string; name: string; lat?: number; lng?: number }

/** View row */
type Row = {
  key: string
  companyName: string
  stationName: string
  modelName: string
  model?: VehicleModel
  modelImgUrl: string
  baseDayPrice: number | null        // min vehicle.pricePerDay (base) for scope
  ctvDiscount: string                // human readable
  distanceKm: number | null          // from userLocation → station
}

/* ======================= Coercer & Normalizer ======================= */
function coerceModelDiscounts(raw: unknown, rawDocForLog?: unknown): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = []

  const push = (
    modelId: unknown,
    discountType?: unknown,
    discountValue?: unknown,
    ctx?: unknown
  ) => {
    const mid =
      (typeof modelId === 'string' && modelId) ||
      (isRecord(modelId) && (
        modelId.modelId || modelId.vehicleModelId || modelId.id ||
        (isRecord(modelId.model) && modelId.model.id) ||
        (isRecord(modelId.modelRef) && modelId.modelRef.id)
      ))

    if (!mid || typeof mid !== 'string') {
      warn('⛔ drop item — missing modelId', { ctx })
      return
    }

    let type: 'fixed' | 'percentage' | undefined =
      discountType === 'fixed' || discountType === 'percentage'
        ? (discountType as 'fixed' | 'percentage')
        : undefined

    let val = typeof discountValue === 'number' ? discountValue : NaN

    if (!type) {
      if (isRecord(ctx)) {
        const pct = ctx.percentage ?? ctx.pct ?? ctx.off
        const fix = ctx.finalPrice ?? ctx.price ?? ctx.fixed
        if (typeof pct === 'number') { type = 'percentage'; val = Number(pct) }
        else if (typeof fix === 'number') { type = 'fixed'; val = Number(fix) }
        else if ((ctx.type === 'fixed' || ctx.type === 'percentage') && typeof ctx.value === 'number') {
          type = ctx.type
          val = Number(ctx.value)
        }
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'
        val = Number(ctx)
      }
    }

    if (type !== 'fixed' && type !== 'percentage') type = 'fixed'
    if (Number.isNaN(val)) val = 0

    out.push({ modelId: mid, discountType: type, discountValue: val })
  }

  if (Array.isArray(raw)) {
    raw.forEach((it, idx) => {
      if (typeof it === 'string') return push(it, 'fixed', 0, it)
      if (isRecord(it)) return push(it, it.discountType, it.discountValue, it)
      warn('⛔ unknown array item in modelDiscounts', { idx, it })
    })
    return out
  }

  if (isRecord(raw)) {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') return push(k, undefined, undefined, v)
      if (isRecord(v)) return push({ modelId: k }, v.discountType, v.discountValue, v)
      warn('⛔ unknown map value in modelDiscounts', { modelId: k, v })
    })

    if (!out.length && isRecord(rawDocForLog)) {
      const fb = rawDocForLog.models || rawDocForLog.vehicleModels
      if (Array.isArray(fb) && fb.length) {
        ;(fb as unknown[]).forEach((x) => push(x, 'fixed', 0, x))
      }
    }
    return out
  }

  return out
}

function extractCompanyId(raw: unknown): string | null {
  if (!isRecord(raw)) return null
  return (
    (raw.companyId as string) ||
    (raw.organizerCompanyId as string) ||
    (raw.providerCompanyId as string) ||
    (isRecord(raw.company) && (raw.company.id as string)) ||
    (isRecord(raw.companyRef) && (raw.companyRef.id as string)) ||
    null
  )
}

function normalizeProgram(raw: unknown): Program & {
  modelDiscounts: ProgramModelDiscount[]
  stationTargets: StationTargetLite[]
  companyId?: string | null
  title?: string
} {
  const r = (raw || {}) as AnyRec
  const modelDiscounts = coerceModelDiscounts(r.modelDiscounts, raw)
  const stationTargets: StationTargetLite[] = Array.isArray(r.stationTargets)
    ? (r.stationTargets as StationTargetLite[]).filter((x) => !!x && typeof x.stationId === 'string')
    : []

  return {
    ...(r as unknown as Program),
    modelDiscounts,
    stationTargets,
    companyId: extractCompanyId(r),
    title: (r.title as string) || '',
  }
}

/* ======================= Firestore loaders ======================= */
async function loadJoinedProgramsForAgent(agentId: string) {
  const pSnap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  )
  const programIds = Array.from(new Set(pSnap.docs.map(d => (d.data() as AnyRec)?.programId).filter(Boolean))) as string[]
  if (!programIds.length) return [] as ReturnType<typeof normalizeProgram>[]

  const all: ReturnType<typeof normalizeProgram>[] = []
  for (const ids of chunk(programIds, 10)) {
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', ids)))
    ps.docs.forEach((d) => all.push(normalizeProgram({ id: d.id, ...(d.data() as AnyRec) })))
  }
  return all.filter(isProgramActiveNow).filter(p => p.modelDiscounts.length > 0)
}

async function loadVehicleModelsByIds(modelIds: string[], coll = 'vehicleModels'): Promise<Map<string, VehicleModel>> {
  const map = new Map<string, VehicleModel>()
  if (!modelIds.length) return map
  for (const part of chunk(modelIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)))
    snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as AnyRec) } as VehicleModel))
  }
  return map
}

async function loadCompaniesByIds(companyIds: string[], coll = 'rentalCompanies'): Promise<Map<string, CompanyLite>> {
  const map = new Map<string, CompanyLite>()
  if (!companyIds.length) return map
  for (const part of chunk(companyIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)))
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec
      map.set(d.id, { id: d.id, name: (data.name as string) || (data.title as string) || d.id })
    })
  }
  return map
}

async function loadStationsByIds(stationIds: string[], coll = 'rentalStations'): Promise<Map<string, StationMeta>> {
  const map = new Map<string, StationMeta>()
  if (!stationIds.length) return map
  for (const part of chunk(stationIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)))
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec
      const lat = (data.lat as number) ?? (isRecord(data.location) ? (data.location.lat as number) : undefined)
      const lng = (data.lng as number) ?? (isRecord(data.location) ? (data.location.lng as number) : undefined)
      map.set(d.id, { id: d.id, name: (data.name as string) || d.id, lat, lng })
    })
  }
  return map
}

/** Load vehicles theo (companyId, modelId [, stationId?]) — trả về tất cả để lọc client */
async function loadVehiclesFor(
  companyIds: string[],
  modelIds: string[],
  coll = 'vehicles',
  statusFilter?: VehicleStatus
): Promise<Vehicle[]> {
  const out: Vehicle[] = []
  if (!companyIds.length || !modelIds.length) return out

  for (const companyId of companyIds) {
    for (const part of chunk(modelIds, 10)) {
      const conds: any[] = [where('companyId', '==', companyId), where('modelId', 'in', part)]
      if (statusFilter) conds.push(where('status', '==', statusFilter))
      const q = query(collection(db, coll), ...conds)
      const snap = await getDocs(q)
      snap.docs.forEach((d) => out.push({ id: d.id, ...(d.data() as AnyRec) } as Vehicle))
    }
  }
  return out
}

/* ======================= Discount display ======================= */
function fmtDiscount(md?: ProgramModelDiscount): string {
  if (!md) return '—'
  if (md.discountType === 'percentage') return `-${Number(md.discountValue || 0)}%`
  // fixed → final price
  const v = Number(md.discountValue ?? 0)
  return v > 0 ? `→ ${formatVND(v)}` : '—'
}

/* ======================= Component ======================= */
interface Props {
  agentId: string
  vehicleModelCollectionName?: string   // default 'vehicleModels'
  stationCollectionName?: string        // default 'rentalStations'
  companyCollectionName?: string        // default 'rentalCompanies'
  vehiclesCollectionName?: string       // default 'vehicles'
  userLocation?: LatLng | null          // nếu có → tính distance
  onlyAvailableVehicles?: boolean       // mặc định true
}

export default function AgentJoinedModelsTable({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  stationCollectionName = 'rentalStations',
  companyCollectionName = 'rentalCompanies',
  vehiclesCollectionName = 'vehicles',
  userLocation = null,
  onlyAvailableVehicles = true,
}: Props) {
  const { t } = useTranslation('common', { useSuspense: false })
  const [rows, setRows] = React.useState<Row[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)

        const programs = await loadJoinedProgramsForAgent(agentId)
        if (!mounted) return

        if (!programs.length) {
          setRows([])
          setLoading(false)
          return
        }

        const modelIds = new Set<string>()
        const stationIds = new Set<string>()
        const companyIds = new Set<string>()

        programs.forEach((p) => {
          p.modelDiscounts.forEach((md: ProgramModelDiscount) => {
            if (md?.modelId) modelIds.add(md.modelId)
          })
          if (p.companyId) companyIds.add(p.companyId)
          if (p.stationTargets?.length) {
            p.stationTargets.forEach((st: StationTargetLite) => st?.stationId && stationIds.add(st.stationId))
          }
        })

        const [modelMap, companyMap, stationMap] = await Promise.all([
          loadVehicleModelsByIds([...modelIds], vehicleModelCollectionName),
          loadCompaniesByIds([...companyIds], companyCollectionName),
          loadStationsByIds([...stationIds], stationCollectionName),
        ])
        if (!mounted) return

        const vehicles = await loadVehiclesFor(
          [...companyIds],
          [...modelIds],
          vehiclesCollectionName,
          onlyAvailableVehicles ? 'Available' : undefined
        )
        if (!mounted) return

        const acc: Row[] = []

        programs.forEach((p) => {
          const companyName = p.companyId ? (companyMap.get(p.companyId)?.name || p.companyId) : t('unknown_company', 'Không rõ')
          const mds: ProgramModelDiscount[] = p.modelDiscounts || []

          mds.forEach((md: ProgramModelDiscount) => {
            const vm = modelMap.get(md.modelId)
            const modelName = vm?.name || md.modelId
            const modelImgUrl = resolveModelImage(vm)

            const vlist = vehicles.filter((v: Vehicle) => v.companyId === p.companyId && v.modelId === md.modelId)

            if (p.stationTargets?.length) {
              p.stationTargets.forEach((st: StationTargetLite) => {
                const stMeta = st.stationId ? stationMap.get(st.stationId) : undefined
                const stationName = stMeta?.name || st.stationId || t('all_stations', 'Tất cả trạm')
                const baseDayPrice = getMinPriceDay(vlist.filter((v: Vehicle) => v.stationId === st.stationId))
                const distanceKm =
                  userLocation && stMeta?.lat != null && stMeta?.lng != null
                    ? haversineKm(userLocation, { lat: stMeta.lat, lng: stMeta.lng })
                    : null

                acc.push({
                  key: `${p.id}:${md.modelId}:${st.stationId}`,
                  companyName,
                  stationName,
                  modelName,
                  model: vm,
                  modelImgUrl,
                  baseDayPrice,
                  ctvDiscount: fmtDiscount(md),
                  distanceKm,
                })
              })
            } else {
              const baseDayPrice = getMinPriceDay(vlist)
              acc.push({
                key: `${p.id}:${md.modelId}:ALL`,
                companyName,
                stationName: t('agent_joined_models.all_stations', 'Tất cả trạm'),
                modelName,
                model: vm,
                modelImgUrl,
                baseDayPrice,
                ctvDiscount: fmtDiscount(md),
                distanceKm: null,
              })
            }
          })
        })

        acc.sort((a, b) => {
          const c = a.companyName.localeCompare(b.companyName)
          if (c !== 0) return c
          const s = a.stationName.localeCompare(b.stationName)
          if (s !== 0) return s
          return a.modelName.localeCompare(b.modelName)
        })

        setRows(acc)
        setLoading(false)
      } catch (e: unknown) {
        warn('load error', e)
        setError((e as Error)?.message || 'Load failed')
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [
    agentId,
    vehicleModelCollectionName,
    stationCollectionName,
    companyCollectionName,
    vehiclesCollectionName,
    userLocation,
    onlyAvailableVehicles,
  ])

  /* ===== Helpers ===== */
  function getMinPriceDay(vlist: Vehicle[]): number | null {
    let min: number | null = null
    vlist.forEach((v: Vehicle) => {
      const p = typeof v.pricePerDay === 'number' ? v.pricePerDay : null
      if (p != null) min = min == null ? p : Math.min(min, p)
    })
    return min
  }

  /* ======================= Render: Cards (mobile) + Table (desktop) ======================= */

  if (loading) {
    return <div className="rounded-lg border p-4 text-sm text-gray-600">
      {t('loading', 'Đang tải dữ liệu…')}
    </div>
  }
  if (error) {
    return <div className="rounded-lg border p-4 text-sm text-red-600">
      {t('error', 'Lỗi')}: {error}
    </div>
  }
  if (!rows || rows.length === 0) {
    return <div className="rounded-lg border p-4 text-sm text-gray-600">
      {t('agent_joined_models.empty', 'Bạn chưa tham gia chương trình nào có mẫu xe.')}
    </div>
  }

  /** Mobile Card list */
  const MobileCards = ({ items }: { items: Row[] }) => (
    <div className="md:hidden grid grid-cols-1 gap-3">
      {items.map((r) => (
        <div
          key={r.key}
          className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        >
          <div className="flex gap-3 p-3">
            <div className="relative w-28 h-20 rounded-md border bg-gray-50 overflow-hidden shrink-0">
              <Image
                src={r.modelImgUrl}
                alt={r.modelName}
                fill
                className="object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-500 truncate">{r.companyName}</div>
              <div className="text-base font-semibold text-gray-900 truncate">{r.modelName}</div>

              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  🚏 {r.stationName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  💸 {r.ctvDiscount}
                </span>
                {r.distanceKm != null && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    📍 {r.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="mt-2 text-[#00d289] font-bold">
                {formatVND(r.baseDayPrice)}{r.baseDayPrice != null ? ' / ngày' : ''}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  /** Desktop Table */
  const DesktopTable = ({ items }: { items: Row[] }) => (
    <div className="hidden md:block w-full overflow-x-auto rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px]">{t('company_name', 'Tên công ty')}</TableHead>
            <TableHead className="min-w-[160px]">{t('station_name', 'Tên trạm')}</TableHead>
            <TableHead className="min-w-[240px]">{t('model_name', 'Tên model')}</TableHead>
            <TableHead className="min-w-[120px]">{t('image', 'Ảnh xe')}</TableHead>
            <TableHead className="min-w-[140px]">{t('price_day', 'Giá thuê ngày')}</TableHead>
            <TableHead className="min-w-[140px]">{t('agent_discount', 'Chiết khấu CTV')}</TableHead>
            <TableHead className="min-w-[140px]">{t('distance', 'Khoảng cách')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium">{r.companyName}</TableCell>
              <TableCell>{r.stationName}</TableCell>

              <TableCell>
                <div className="font-medium">{r.modelName}</div>
                {r.model?.brand && (
                  <div className="mt-1 text-xs text-gray-500">
                    {r.model.brand}
                  </div>
                )}
              </TableCell>

              <TableCell>
                <div className="w-[80px] h-[60px] relative rounded border bg-gray-50 overflow-hidden">
                  <Image
                    src={r.modelImgUrl}
                    alt={r.modelName}
                    fill
                    className="object-contain"
                  />
                </div>
              </TableCell>

              <TableCell>
                <span className="font-semibold">
                  {formatVND(r.baseDayPrice)}
                </span>
                {r.baseDayPrice != null && <span className="text-xs text-gray-500">/ngày</span>}
              </TableCell>

              <TableCell>
                <span className="text-sm">{r.ctvDiscount}</span>
              </TableCell>

              <TableCell>
                {r.distanceKm != null
                  ? `${r.distanceKm.toFixed(1)} km`
                  : <span className="text-gray-400">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="w-full">
      {/* Mobile cards */}
      <MobileCards items={rows} />

      {/* Desktop table */}
      <DesktopTable items={rows} />
    </div>
  )
}
