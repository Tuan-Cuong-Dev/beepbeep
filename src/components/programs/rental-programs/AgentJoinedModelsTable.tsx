'use client'

/**
 * AgentJoinedModelsTable — distance-ready + mobile cards
 * - Hiển thị: Công ty • Trạm • Model • Ảnh • Giá/ngày (min từ vehicles) • Chiết khấu CTV • Khoảng cách
 * - Khoảng cách:
 *    + Có stationTargets  → đo theo từng trạm chỉ định
 *    + Không stationTargets → lấy tất cả trạm thuộc company, tính khoảng cách gần nhất (fallback: provider location)
 * - Geolocation: navigator → agents/{agentId}.location.geo → agentCoordsFallback
 */

import * as React from 'react'
import Image from 'next/image'
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
  doc,
  getDoc,
  GeoPoint,
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
const LOG = false
const log  = (...a: unknown[]) => LOG && console.log('[AgentJoinedModelsTable]', ...a)
const warn = (...a: unknown[]) => LOG && console.warn('[AgentJoinedModelsTable]', ...a)

type AnyRec = Record<string, unknown>
const isRecord = (x: unknown): x is AnyRec => typeof x === 'object' && x !== null

function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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

/** Haversine (km) */
type LatLng = { lat: number; lng: number }
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s1 = Math.sin(dLat / 2) ** 2 +
             Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
             Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1))
  return R * c
}

/* ===== Station geo extract (đa schema) ===== */
function geoPointToLatLng(g?: GeoPoint | null): LatLng | null {
  if (!g) return null
  // @ts-ignore
  const lat = typeof g.latitude === 'number' ? g.latitude : g._lat
  // @ts-ignore
  const lng = typeof g.longitude === 'number' ? g.longitude : g._long
  return (typeof lat === 'number' && typeof lng === 'number') ? { lat, lng } : null
}
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null
  const m = s.trim().match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  const m2 = s.match(/(-?\d+\.\d+)/g)
  return m2 && m2.length >= 2 ? { lat: parseFloat(m2[0]), lng: parseFloat(m2[1]) } : null
}
function extractLatLngFromDoc(data: AnyRec): LatLng | null {
  // 1) { geo: {lat,lng} }
  if (isRecord(data.geo) && typeof data.geo.lat === 'number' && typeof data.geo.lng === 'number') {
    return { lat: data.geo.lat, lng: data.geo.lng }
  }
  // 2) { location: { geo: GeoPoint } }
  if (isRecord(data.location) && 'geo' in data.location) {
    const ll = geoPointToLatLng(data.location.geo as GeoPoint)
    if (ll) return ll
  }
  // 3) lat/lng rời rạc
  const lat = (data.lat as number | undefined) ?? (isRecord(data.location) ? (data.location.lat as number | undefined) : undefined)
  const lng = (data.lng as number | undefined) ?? (isRecord(data.location) ? (data.location.lng as number | undefined) : undefined)
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  // 4) location là chuỗi "lat,lng"
  if (typeof data.location === 'string') {
    const ll = parseLatLngString(data.location)
    if (ll) return ll
  }
  return null
}

/* ======================= Types ======================= */
type StationTargetLite = { stationId: string }
type CompanyLite = { id: string; name: string }

type StationMeta = {
  id: string
  name: string
  ll: LatLng | null
}

type ProviderMeta = {
  id: string
  name: string
  ll: LatLng | null
}

/** View row */
type Row = {
  key: string
  companyId?: string | null
  companyName: string
  stationName: string
  modelName: string
  model?: VehicleModel
  modelImgUrl: string
  baseDayPrice: number | null
  ctvDiscount: string
  distanceKm: number | null
}

/* ======================= Coercer & Normalizer ======================= */
function coerceModelDiscounts(raw: unknown, rawDocForLog?: unknown): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = []
  const push = (modelId: unknown, discountType?: unknown, discountValue?: unknown, ctx?: unknown) => {
    const mid =
      (typeof modelId === 'string' && modelId) ||
      (isRecord(modelId) && (
        modelId.modelId || modelId.vehicleModelId || modelId.id ||
        (isRecord(modelId.model) && modelId.model.id) ||
        (isRecord(modelId.modelRef) && modelId.modelRef.id)
      ))
    if (!mid || typeof mid !== 'string') return

    let type: 'fixed' | 'percentage' | undefined =
      discountType === 'fixed' || discountType === 'percentage' ? discountType as any : undefined
    let val = typeof discountValue === 'number' ? discountValue : NaN

    if (!type) {
      if (isRecord(ctx)) {
        const pct = ctx.percentage ?? ctx.pct ?? ctx.off
        const fix = ctx.finalPrice ?? ctx.price ?? ctx.fixed
        if (typeof pct === 'number') { type = 'percentage'; val = Number(pct) }
        else if (typeof fix === 'number') { type = 'fixed'; val = Number(fix) }
        else if ((ctx.type === 'fixed' || ctx.type === 'percentage') && typeof ctx.value === 'number') {
          type = ctx.type; val = Number(ctx.value)
        }
      } else if (typeof ctx === 'number') {
        type = ctx <= 100 ? 'percentage' : 'fixed'; val = Number(ctx)
      }
    }
    if (type !== 'fixed' && type !== 'percentage') type = 'fixed'
    if (Number.isNaN(val)) val = 0
    out.push({ modelId: mid, discountType: type, discountValue: val })
  }

  if (Array.isArray(raw)) {
    raw.forEach((it) => {
      if (typeof it === 'string') push(it, 'fixed', 0, it)
      else if (isRecord(it)) push(it, it.discountType, it.discountValue, it)
    })
    return out
  }
  if (isRecord(raw)) {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === 'number') push(k, undefined, undefined, v)
      else if (isRecord(v)) push({ modelId: k }, v.discountType, v.discountValue, v)
    })
    if (!out.length && isRecord(rawDocForLog)) {
      const fb = (rawDocForLog as AnyRec).models || (rawDocForLog as AnyRec).vehicleModels
      if (Array.isArray(fb)) fb.forEach((x) => push(x as any, 'fixed', 0, x))
    }
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
    ? (r.stationTargets as StationTargetLite[]).filter(x => !!x && typeof x.stationId === 'string')
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
      const ll = extractLatLngFromDoc(data)
      map.set(d.id, { id: d.id, name: (data.name as string) || d.id, ll })
    })
  }
  return map
}

/** NEW: load all stations belonging to companies (for programs with NO stationTargets) */
async function loadStationsForCompanies(companyIds: string[], coll = 'rentalStations'): Promise<Map<string, StationMeta[]>> {
  const map = new Map<string, StationMeta[]>()
  if (!companyIds.length) return map
  for (const part of chunk(companyIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where('companyId', 'in', part)))
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec
      const ll = extractLatLngFromDoc(data)
      const companyId = (data.companyId as string) || ''
      const arr = map.get(companyId) || []
      arr.push({ id: d.id, name: (data.name as string) || d.id, ll })
      map.set(companyId, arr)
    })
  }
  return map
}

/** Provider location as station fallback (when a companyId is actually a provider) */
async function loadProvidersByIds(providerIds: string[], coll = 'privateProviders'): Promise<Map<string, ProviderMeta>> {
  const map = new Map<string, ProviderMeta>()
  if (!providerIds.length) return map
  for (const part of chunk(providerIds, 10)) {
    const snap = await getDocs(query(collection(db, coll), where(documentId(), 'in', part)))
    snap.docs.forEach((d) => {
      const data = d.data() as AnyRec
      const ll = extractLatLngFromDoc(data)
      map.set(d.id, { id: d.id, name: (data.name as string) || d.id, ll })
    })
  }
  return map
}

/** Load vehicles theo (companyId, modelId) để lấy min price */
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

/* ===== Agent location (geolocate → agent doc → fallback) ===== */
async function loadAgentLatLng(agentId?: string): Promise<LatLng | null> {
  if (!agentId) return null
  try {
    const ref = doc(db, 'agents', agentId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data() as AnyRec
    if (isRecord(data.location) && data.location && 'geo' in data.location) {
      return geoPointToLatLng(data.location.geo as GeoPoint)
    }
    return null
  } catch {
    return null
  }
}

/* ======================= Discount display ======================= */
function fmtDiscount(md?: ProgramModelDiscount): string {
  if (!md) return '—'
  if (md.discountType === 'percentage') return `-${Number(md.discountValue || 0)}%`
  const v = Number(md.discountValue ?? 0)
  return v > 0 ? `→ ${formatVND(v)}` : '—'
}

/* ======================= Component ======================= */
interface Props {
  agentId: string
  vehicleModelCollectionName?: string
  stationCollectionName?: string
  companyCollectionName?: string
  providerCollectionName?: string
  vehiclesCollectionName?: string
  agentCoordsFallback?: LatLng | null
  userLocation?: LatLng | null
  onlyAvailableVehicles?: boolean
}

export default function AgentJoinedModelsTable({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  stationCollectionName = 'rentalStations',
  companyCollectionName = 'rentalCompanies',
  providerCollectionName = 'privateProviders',
  vehiclesCollectionName = 'vehicles',
  agentCoordsFallback = null,
  userLocation = null,
  onlyAvailableVehicles = true,
}: Props) {
  const { t } = useTranslation('common', { useSuspense: false })
  const [rows, setRows] = React.useState<Row[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [agentPos, setAgentPos] = React.useState<LatLng | null>(userLocation)

  // Auto-detect vị trí agent nếu không truyền userLocation
  React.useEffect(() => {
    if (userLocation) { setAgentPos(userLocation); return }
    let cancelled = false
    ;(async () => {
      try {
        const hasGeo = typeof window !== 'undefined' && !!navigator.geolocation
        if (hasGeo) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => { if (!cancelled) setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
            async () => { const ll = await loadAgentLatLng(agentId); if (!cancelled) setAgentPos(ll ?? agentCoordsFallback ?? null) },
            { enableHighAccuracy: true, timeout: 8000 }
          )
        } else {
          const ll = await loadAgentLatLng(agentId)
          if (!cancelled) setAgentPos(ll ?? agentCoordsFallback ?? null)
        }
      } catch {
        if (!cancelled) setAgentPos(agentCoordsFallback ?? null)
      }
    })()
    return () => { cancelled = true }
  }, [agentId, userLocation, agentCoordsFallback])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)

        // 1) Programs đã JOIN
        const programs = await loadJoinedProgramsForAgent(agentId)
        if (!mounted) return
        if (!programs.length) { setRows([]); setLoading(false); return }

        // 2) Gom IDs
        const modelIds = new Set<string>()
        const stationIds = new Set<string>()
        const companyIds = new Set<string>()
        const companiesWithExplicitStations = new Set<string>()
        const companiesWithoutStations = new Set<string>()

        programs.forEach((p) => {
          p.modelDiscounts.forEach((md: ProgramModelDiscount) => md?.modelId && modelIds.add(md.modelId))
          if (p.companyId) {
            companyIds.add(p.companyId)
            if (p.stationTargets?.length) companiesWithExplicitStations.add(p.companyId)
            else companiesWithoutStations.add(p.companyId)
          }
          p.stationTargets?.forEach((st: StationTargetLite) => st?.stationId && stationIds.add(st.stationId))
        })

        // 3) Load meta
        const [modelMap, companyMap, stationMapById] = await Promise.all([
          loadVehicleModelsByIds([...modelIds], vehicleModelCollectionName),
          loadCompaniesByIds([...companyIds], companyCollectionName),
          loadStationsByIds([...stationIds], stationCollectionName),
        ])
        if (!mounted) return

        // 3b) NEW: với các program không có stationTargets → tải toàn bộ trạm theo company
        const companyStationsMap = await loadStationsForCompanies([...companiesWithoutStations], stationCollectionName)
        // 3c) Fallback: với công ty là provider (không có rentalStations) → lấy location của provider
        const providerMetaMap = await loadProvidersByIds([...companyIds], providerCollectionName)

        // 4) Load vehicles để lấy giá base
        const vehicles = await loadVehiclesFor(
          [...companyIds],
          [...modelIds],
          vehiclesCollectionName,
          onlyAvailableVehicles ? 'Available' : undefined
        )
        if (!mounted) return

        // 5) Helpers
        const getMinPriceDay = (vlist: Vehicle[]): number | null => {
          let min: number | null = null
          vlist.forEach((v) => {
            const p = typeof v.pricePerDay === 'number' ? v.pricePerDay : null
            if (p != null) min = min == null ? p : Math.min(min, p)
          })
          return min
        }
        const pickNearest = (from: LatLng | null, cands: { name: string; ll: LatLng | null }[]) => {
          if (!from) return { name: t('agent_joined_models.all_stations', 'Tất cả trạm'), distanceKm: null }
          let best: { name: string; distanceKm: number } | null = null
          cands.forEach((c) => {
            if (!c.ll) return
            const d = haversineKm(from, c.ll)
            if (!best || d < best.distanceKm) best = { name: c.name, distanceKm: d }
          })
          return best || { name: t('agent_joined_models.all_stations', 'Tất cả trạm'), distanceKm: null }
        }

        // 6) Build rows
        const acc: Row[] = []

        programs.forEach((p) => {
          const companyName = p.companyId ? (companyMap.get(p.companyId)?.name || p.companyId) : t('unknown_company', 'Không rõ')
          const mds: ProgramModelDiscount[] = p.modelDiscounts || []

          mds.forEach((md: ProgramModelDiscount) => {
            const vm = modelMap.get(md.modelId)
            const modelName = vm?.name || md.modelId
            const modelImgUrl = resolveModelImage(vm)
            const vlist = vehicles.filter((v) => v.companyId === p.companyId && v.modelId === md.modelId)

            if (p.stationTargets?.length) {
              // theo từng trạm chỉ định
              p.stationTargets.forEach((st: StationTargetLite) => {
                const stMeta = st.stationId ? stationMapById.get(st.stationId) : undefined
                const stationName = stMeta?.name || st.stationId || t('all_stations', 'Tất cả trạm')
                const baseDayPrice = getMinPriceDay(vlist.filter((v) => v.stationId === st.stationId))
                const distanceKm = (agentPos && stMeta?.ll) ? haversineKm(agentPos, stMeta.ll) : null

                acc.push({
                  key: `${p.id}:${md.modelId}:${st.stationId}`,
                  companyId: p.companyId,
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
              // không chỉ định trạm → tính khoảng cách gần nhất trong các trạm của company (fallback: provider)
              const stations = (p.companyId && companyStationsMap.get(p.companyId)) || []
              const providerAsStation = p.companyId ? providerMetaMap.get(p.companyId) : undefined
              const cand: { name: string; ll: LatLng | null }[] = [
                ...stations.map(s => ({ name: s.name, ll: s.ll })),
                ...(providerAsStation ? [{ name: providerAsStation.name, ll: providerAsStation.ll }] : []),
              ]
              const nearest = pickNearest(agentPos, cand)
              const baseDayPrice = getMinPriceDay(vlist)

              acc.push({
                key: `${p.id}:${md.modelId}:ALL`,
                companyId: p.companyId,
                companyName,
                stationName: cand.length ? nearest.name : t('agent_joined_models.all_stations', 'Tất cả trạm'),
                modelName,
                model: vm,
                modelImgUrl,
                baseDayPrice,
                ctvDiscount: fmtDiscount(md),
                distanceKm: cand.length ? nearest.distanceKm : null,
              })
            }
          })
        })

        // 7) Sort: company → station → distance(asc) → model
        acc.sort((a, b) => {
          const c = a.companyName.localeCompare(b.companyName)
          if (c !== 0) return c
          const s = a.stationName.localeCompare(b.stationName)
          if (s !== 0) return s
          const da = a.distanceKm, db = b.distanceKm
          if (da == null && db != null) return 1
          if (da != null && db == null) return -1
          if (da != null && db != null && da !== db) return da - db
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
    providerCollectionName,
    vehiclesCollectionName,
    onlyAvailableVehicles,
    agentPos?.lat,
    agentPos?.lng,
  ])

  /* ======================= Render ======================= */
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

  const fmtKm = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)} km`)

  /** Mobile Card list */
  const MobileCards = ({ items }: { items: Row[] }) => (
    <div className="md:hidden grid grid-cols-1 gap-3">
      {items.map((r) => (
        <div key={r.key} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex gap-3 p-3">
            <div className="relative w-28 h-20 rounded-md border bg-gray-50 overflow-hidden shrink-0">
              <Image src={r.modelImgUrl} alt={r.modelName} fill className="object-contain" />
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
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  📍 {fmtKm(r.distanceKm)}
                </span>
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
                  <div className="mt-1 text-xs text-gray-500">{r.model.brand}</div>
                )}
              </TableCell>

              <TableCell>
                <div className="w-[80px] h-[60px] relative rounded border bg-gray-50 overflow-hidden">
                  <Image src={r.modelImgUrl} alt={r.modelName} fill className="object-contain" />
                </div>
              </TableCell>

              <TableCell>
                <span className="font-semibold">{formatVND(r.baseDayPrice)}</span>
                {r.baseDayPrice != null && <span className="text-xs text-gray-500">/ngày</span>}
              </TableCell>

              <TableCell><span className="text-sm">{r.ctvDiscount}</span></TableCell>

              <TableCell>{fmtKm(r.distanceKm)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="w-full">
      <MobileCards items={rows} />
      <DesktopTable items={rows} />
    </div>
  )
}
