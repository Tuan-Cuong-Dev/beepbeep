'use client'

// CTV Programs Table — RentalCompany + PrivateProvider (provider == station)
// + Search & Distance Filters
// 06/09/2025

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  GeoPoint,
} from 'firebase/firestore'
import { db } from '@/src/firebaseConfig'
import type { Program } from '@/src/lib/programs/programsType'
import type { Station } from '@/src/lib/stations/stationTypes'
import type { Agent } from '@/src/lib/agents/agentTypes'
import type { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes'
import type { PrivateProvider } from '@/src/lib/privateProviders/privateProviderTypes'

type ProgramFilters = {
  query: string
  maxDistanceKm: number | null
  includeUnknownDistance: boolean
}

import { Badge } from '@/src/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { useTranslation } from 'react-i18next'

/* ============== Config & Log helpers ============== */
const LOG = true
const log = (...a: any[]) => LOG && console.log('[AgentProgramsTable]', ...a)
const warn = (...a: any[]) => LOG && console.warn('[AgentProgramsTable]', ...a)
const err = (...a: any[]) => LOG && console.error('[AgentProgramsTable]', ...a)

/* ============== Props ============== */
interface AgentProgramsTableProps {
  agentId?: string
  agentCoordsFallback?: { lat: number; lng: number } | null
  stationCollectionName?: string // default: 'rentalStations'
  /** Nếu truyền, chỉ hiển thị (companyId) thuộc danh sách này */
  companyIds?: string[]
  /** Nếu true (mặc định), tự lọc chỉ company/provider đang active */
  includeOnlyOwnedCompanies?: boolean
  /** Bộ lọc tìm kiếm & khoảng cách (optional). Nếu không truyền, dùng mặc định */
  filters?: ProgramFilters
}

/* ============== Helpers ============== */
function geoPointToLatLng(g?: GeoPoint | null): { lat: number; lng: number } | null {
  if (!g) return null
  // @ts-ignore
  const lat = typeof g.latitude === 'number' ? g.latitude : g._lat
  // @ts-ignore
  const lng = typeof g.longitude === 'number' ? g.longitude : g._long
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

function parseLatLngString(s?: string): { lat: number; lng: number } | null {
  if (!s) return null
  const m = s.trim().match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  const m2 = s.match(/(-?\d+\.\d+)/g)
  return m2 && m2.length >= 2 ? { lat: parseFloat(m2[0]), lng: parseFloat(m2[1]) } : null
}

function extractStationLatLng(st: any): { lat: number; lng: number } | null {
  if (st.geo && typeof st.geo.lat === 'number' && typeof st.geo.lng === 'number') return st.geo
  if (st.location?.geo) return geoPointToLatLng(st.location.geo as GeoPoint) // provider virtual
  return parseLatLngString(st.location)
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1))
  return R * c
}

const safeToMillis = (t?: any): number | null => {
  try {
    const ms = t?.toMillis?.()
    return typeof ms === 'number' ? ms : null
  } catch {
    return null
  }
}

/* ============== Business logic helpers ============== */
function programAppliesToStation(p: Program, station: any) {
  try {
    if (p.type !== 'rental_program' || p.isActive === false) return false
    if (p.companyId && p.companyId !== station.companyId) return false
    const now = Date.now()
    const s = safeToMillis((p as any).startDate)
    const e = safeToMillis((p as any).endDate)
    if ((s && s > now) || (e && e < now)) return false
    const targets = p.stationTargets ?? []
    return targets.length === 0 || targets.some((t) => t.stationId === station.id)
  } catch (e) {
    err('programAppliesToStation error', e)
    return false
  }
}

/* ============== Loaders ============== */
async function loadCompanyProviderMaps(includeOnlyOwnedCompanies: boolean): Promise<{
  allowIds: Set<string> | null
  nameMap: Map<string, { name: string; kind: 'company' | 'provider' }>
}> {
  log('loadCompanyProviderMaps:start', { includeOnlyOwnedCompanies })

  const [companiesSnap, providersSnap] = await Promise.all([
    getDocs(collection(db, 'rentalCompanies')),
    getDocs(collection(db, 'privateProviders')),
  ])

  const nameMap = new Map<string, { name: string; kind: 'company' | 'provider' }>()
  const allow = new Set<string>()

  companiesSnap.docs.forEach((d) => {
    const data = d.data() as Partial<RentalCompany>
    const active = data.isActive !== false
    const name = data.name || d.id
    nameMap.set(d.id, { name, kind: 'company' })
    if (!includeOnlyOwnedCompanies || active) allow.add(d.id)
  })

  providersSnap.docs.forEach((d) => {
    const data = d.data() as Partial<PrivateProvider>
    const active = (data as any)?.isActive !== false
    const name = data?.name || d.id
    nameMap.set(d.id, { name, kind: 'provider' })
    if (!includeOnlyOwnedCompanies || active) allow.add(d.id)
  })

  const allowIds = includeOnlyOwnedCompanies ? allow : null
  log('loadCompanyProviderMaps:done', {
    totalCompanies: companiesSnap.size,
    totalProviders: providersSnap.size,
    allowCount: allowIds ? allowIds.size : 'ALL',
  })
  return { allowIds, nameMap }
}

async function loadRentalStations(collectionName: string): Promise<Station[]> {
  log('loadRentalStations:start', { collectionName })
  const snap = await getDocs(collection(db, collectionName))
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Station[]
  log('loadRentalStations:done', { count: list.length, sample: list[0] })
  return list
}

async function loadProviderVirtualStations(): Promise<
  Array<{
    id: string
    name: string
    displayAddress: string
    companyId: string
    location?: any
    geo?: { lat: number; lng: number } | null
    __source: 'provider'
  }>
> {
  log('loadProviderVirtualStations:start')
  const snap = await getDocs(collection(db, 'privateProviders'))
  const rows: any[] = []
  snap.docs.forEach((d) => {
    const p = d.data() as PrivateProvider
    const geo = p.location?.geo ? geoPointToLatLng(p.location.geo as any) : null
    rows.push({
      id: d.id,
      name: p.name,
      displayAddress: p.displayAddress,
      companyId: d.id, // providerId
      location: p.location,
      geo,
      __source: 'provider' as const,
    })
  })
  log('loadProviderVirtualStations:done', { count: rows.length, sample: rows[0] })
  return rows
}

async function loadAgentLatLng(agentId?: string) {
  if (!agentId) return null
  try {
    log('loadAgentLatLng:start', { agentId })
    const ref = doc(db, 'agents', agentId)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      warn('loadAgentLatLng:not found', agentId)
      return null
    }
    const agent = { id: snap.id, ...(snap.data() as any) } as Agent
    const ll = agent.location?.geo ? geoPointToLatLng(agent.location.geo as any) : null
    log('loadAgentLatLng:done', { ll })
    return ll
  } catch (e) {
    err('loadAgentLatLng:error', e)
    return null
  }
}

async function loadActiveRentalPrograms(): Promise<Program[]> {
  log('loadActiveRentalPrograms:start')
  const qy = query(
    collection(db, 'programs'),
    where('type', '==', 'rental_program'),
    where('isActive', '==', true)
  )
  const snap = await getDocs(qy)
  const now = Date.now()

  const list = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) } as Program))
    .filter((p) => {
      const s = safeToMillis((p as any).startDate)
      const e = safeToMillis((p as any).endDate)
      return !((s && s > now) || (e && e < now))
    })

  log('loadActiveRentalPrograms:done', { count: list.length, sample: list[0] })
  return list
}

/* ============== Component ============== */
export default function AgentProgramsTable({
  agentId,
  agentCoordsFallback = null,
  stationCollectionName = 'rentalStations',
  companyIds,
  includeOnlyOwnedCompanies = true,
  filters,
}: AgentProgramsTableProps) {
  const { t } = useTranslation('common')

  // default filters nếu không truyền
  const effectiveFilters: ProgramFilters = {
    query: filters?.query ?? '',
    maxDistanceKm: filters?.maxDistanceKm ?? null,
    includeUnknownDistance: filters?.includeUnknownDistance ?? true,
  }

  const [agentPos, setAgentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [rowsData, setRowsData] = useState<any[] | null>(null) // merged stations + provider-virtual
  const [programs, setPrograms] = useState<Program[] | null>(null)
  const [companyNameMap, setCompanyNameMap] = useState<
    Map<string, { name: string; kind: 'company' | 'provider' }>
  >(new Map())
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    log('mounted')
    return () => log('unmounted')
  }, [])

  // 1) Browser geolocation → 2) Agent doc → 3) Fallback
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const hasGeo = typeof window !== 'undefined' && !!navigator.geolocation
        log('geolocation:init', { hasGeo, agentId, agentCoordsFallback })
        if (hasGeo) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!cancelled) setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            },
            async () => {
              const fromAgent = await loadAgentLatLng(agentId)
              if (!cancelled) setAgentPos(fromAgent ?? agentCoordsFallback)
            },
            { enableHighAccuracy: true, timeout: 8000 }
          )
        } else {
          const fromAgent = await loadAgentLatLng(agentId)
          if (!cancelled) setAgentPos(fromAgent ?? agentCoordsFallback)
        }
      } catch (e) {
        err('geolocation:unexpected', e)
        setAgentPos(agentCoordsFallback)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agentId, agentCoordsFallback])

  // Load maps → stations + providers → merge/filter → programs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { allowIds, nameMap } = await loadCompanyProviderMaps(includeOnlyOwnedCompanies)
        if (!mounted) return
        setCompanyNameMap(nameMap)

        const allowFromProp = companyIds ? new Set(companyIds) : null
        const allowFinal: Set<string> | null =
          allowFromProp ?? (includeOnlyOwnedCompanies ? allowIds || null : null)

        const stations = await loadRentalStations(stationCollectionName)
        if (!mounted) return

        const providerStations = await loadProviderVirtualStations()
        if (!mounted) return

        let merged: any[] = [...stations, ...providerStations]
        if (allowFinal) {
          merged = merged.filter((s: any) => !!s.companyId && allowFinal.has(s.companyId))
        }

        const pr = await loadActiveRentalPrograms()
        if (!mounted) return

        setRowsData(merged)
        setPrograms(pr)
        setLoading(false)

        log('postLoad', {
          stationsRental: stations.length,
          stationsProvider: providerStations.length,
          merged: merged.length,
          programs: pr.length,
          filteredByCompany: !!allowFinal,
        })
      } catch (e: any) {
        err('load data error', e)
        setErrorMsg(e?.message || 'Failed to load')
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [stationCollectionName, JSON.stringify(companyIds), includeOnlyOwnedCompanies])

  // 1) Map -> hasPromo & distance & company name + sort (hasPromo desc, distance asc)
  const rows = useMemo(() => {
    if (!rowsData) return []
    const result = rowsData.map((s: any) => {
      const loc = extractStationLatLng(s)
      const distanceKm = agentPos && loc ? haversineKm(agentPos, loc) : null
      const hasPromo = (programs || []).some((p) => programAppliesToStation(p, s))
      const meta = companyNameMap.get(s.companyId)
      const companyName = meta?.name || s.companyName || s.companyId
      const companyKind = meta?.kind // 'company' | 'provider' | undefined
      return { station: s, distanceKm, hasPromo, companyName, companyKind }
    })
    return result.sort((a, b) => {
      if (a.hasPromo !== b.hasPromo) return a.hasPromo ? -1 : 1
      const da = a.distanceKm
      const db = b.distanceKm
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      if (da !== db) return da - db
      return (a.companyName || '').localeCompare(b.companyName || '') ||
             (a.station?.name || '').localeCompare(b.station?.name || '')
    })
  }, [rowsData, programs, agentPos, companyNameMap])

  // 2) Áp dụng FILTERS: text + maxDistance + includeUnknownDistance
  const filteredRows = useMemo(() => {
    if (!rows.length) return []
    const f = effectiveFilters

    const q = (f.query || '').trim().toLowerCase()
    const hit = (s: string | undefined) =>
      !q || (s ?? '').toLowerCase().includes(q)

    return rows.filter(({ station, companyName, distanceKm }) => {
      // distance
      if (f.maxDistanceKm != null) {
        if (distanceKm == null) {
          if (!f.includeUnknownDistance) return false
        } else if (distanceKm > f.maxDistanceKm) {
          return false
        }
      }
      // text query
      const any: any = station
      return (
        hit(companyName) ||
        hit(any?.name) ||
        hit(any?.displayAddress) ||
        hit(any?.location?.displayAddress)
      )
    })
  }, [rows, effectiveFilters])

  /* ================ Render ================ */
  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600 border rounded-lg">
        {t('loading', 'Đang tải dữ liệu…')}
      </div>
    )
  }
  if (errorMsg) {
    return (
      <div className="p-4 text-sm text-red-600 border rounded-lg">
        {t('error', 'Lỗi')}: {errorMsg}
      </div>
    )
  }
  if (!filteredRows.length) {
    return (
      <div className="p-4 text-sm text-gray-600 border rounded-lg space-y-2">
        <div>{t('agent_programs_table.empty', 'Không có kết quả khớp bộ lọc.')}</div>
        <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
          <li>{t('agent_programs_table.suggestion_distance', 'Thử xoá hoặc nới lỏng bộ lọc khoảng cách.')}</li>
          <li>{t('agent_programs_table.suggestion_keyword', 'Kiểm tra từ khóa tìm kiếm (công ty / trạm / địa chỉ).')}</li>
        </ul>
      </div>
    )
  }

  const fmtKm = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)} km`)

  return (
    <div className="w-full">
      {/* ===== Mobile: Card list ===== */}
      <div className="md:hidden space-y-3">
        {filteredRows.map(({ station, distanceKm, hasPromo, companyName, companyKind }) => {
          const s: any = station
          return (
            <div key={s.id} className="rounded-xl border p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{companyName}</div>
                  {!!companyKind && (
                    <div className="mt-1">
                      <Badge variant={companyKind === 'company' ? 'default' : 'secondary'}>
                        {companyKind === 'company'
                          ? t('agent_programs_table.rental_company', 'Công ty cho thuê')
                          : t('agent_programs_table.private_provider', 'Nhà cung cấp cá nhân')}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {t('agent_programs_table.distance', 'Khoảng cách')}
                  </div>
                  <div className="text-sm font-medium">{fmtKm(distanceKm)}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {s.displayAddress || s.location?.displayAddress || '—'}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  {hasPromo ? (
                    <Badge variant="brand">
                      {t('agent_programs_table.has_promo', 'Có khuyến mại')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {t('agent_programs_table.no_promo', 'Chưa có')}
                    </Badge>
                  )}
                </div>

                <Link
                  href={{ pathname: '/dashboard/programs', query: { companyId: s.companyId, stationId: s.id } }}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('view', 'Xem')}
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== Desktop: Table ===== */}
      <div className="hidden md:block overflow-auto rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">
                {t('agent_programs_table.company', 'Công ty / Nhà cung cấp')}
              </TableHead>
              <TableHead className="min-w-[220px]">
                {t('agent_programs_table.station', 'Trạm')}
              </TableHead>
              <TableHead className="w-[120px] text-right">
                {t('agent_programs_table.distance', 'Khoảng cách')}
              </TableHead>
              <TableHead className="w-[160px]">
                {t('agent_programs_table.promo_status', 'Khuyến mại')}
              </TableHead>
              <TableHead className="w-[120px] text-right">
                {t('agent_programs_table.actions', 'Thao tác')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(({ station, distanceKm, hasPromo, companyName, companyKind }) => {
              const s: any = station
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{companyName}</div>
                    {!!companyKind && (
                      <div className="mt-1">
                        <Badge variant={companyKind === 'company' ? 'default' : 'secondary'}>
                          {companyKind === 'company'
                            ? t('agent_programs_table.rental_company', 'Công ty cho thuê')
                            : t('agent_programs_table.private_provider', 'Nhà cung cấp cá nhân')}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.displayAddress || s.location?.displayAddress || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtKm(distanceKm)}
                  </TableCell>
                  <TableCell>
                    {hasPromo ? (
                      <Badge variant="brand">
                        {t('agent_programs_table.has_promo', 'Có khuyến mại')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('agent_programs_table.no_promo', 'Chưa có')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={{
                        pathname: '/dashboard/programs',
                        query: { companyId: s.companyId, stationId: s.id },
                      }}
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t('view', 'Xem')}
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
