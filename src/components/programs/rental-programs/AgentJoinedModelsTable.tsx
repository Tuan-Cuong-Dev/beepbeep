'use client'

/**
 * AgentJoinedModelsTable — refactor
 * - Hiển thị tất cả VehicleModels nằm trong các Program mà agent đã JOINED.
 * - Cột: Tên xe • Cấu hình • Giá (áp KM) • Trạm
 * - Coercer modelDiscounts hỗ trợ nhiều schema:
 *   A) [{ modelId, discountType, discountValue }]
 *   B) ['vm1','vm2']                    // mặc định fixed 0
 *   C) { vm1: 10, vm2: 180000 }         // ≤100 → percentage, >100 → fixed (final price)
 *   D) { vm1: { type:'percentage', value:15 }, vm2: { finalPrice:160000 }, vm3:{ price:200000 } }
 */

import * as React from 'react'
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

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/src/components/ui/table'
import { Badge } from '@/src/components/ui/badge'

/* ======================= DEBUG helpers ======================= */

const DEBUG = true
const log  = (...a: any[]) => DEBUG && console.log('[AgentJoinedModelsTable]', ...a)
const warn = (...a: any[]) => DEBUG && console.warn('[AgentJoinedModelsTable]', ...a)
const err  = (...a: any[]) => DEBUG && console.error('[AgentJoinedModelsTable]', ...a)

function chunk<T>(arr: T[], size = 10): T[][] {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}
function toArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[]
  if (v && typeof v === 'object') {
    const vals = Object.values(v) as T[]
    log('toArray: converted object->array, len=', vals.length)
    return vals
  }
  return []
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
  const ok = !((s && s > now) || (e && e < now)) && p.isActive !== false
  if (DEBUG && !ok) {
    warn('Program filtered (inactive/out-of-time):', {
      id: (p as any).id, title: p.title, start: s, end: e, isActive: p.isActive,
    })
  }
  return ok
}

/** Chọn 1 đơn giá ưu tiên để hiển thị (day > hour > week > month) */
function pickBasePrice(vm: VehicleModel): { label: string; value: number | null } {
  if (typeof vm.pricePerDay === 'number')   return { label: 'ngày',  value: vm.pricePerDay }
  if (typeof vm.pricePerHour === 'number')  return { label: 'giờ',   value: vm.pricePerHour }
  if (typeof vm.pricePerWeek === 'number')  return { label: 'tuần',  value: vm.pricePerWeek }
  if (typeof vm.pricePerMonth === 'number') return { label: 'tháng', value: vm.pricePerMonth }
  return { label: '', value: null }
}

/** Tính giá sau KM: fixed → final price; percentage → giảm % */
function applyDiscount(base: number | null, md?: ProgramModelDiscount | null): number | null {
  if (base == null) return null
  if (!md) return base
  if (md.discountType === 'fixed')       return Math.max(0, Number(md.discountValue ?? base))
  if (md.discountType === 'percentage')  return Math.max(0, Math.round((base * (100 - Number(md.discountValue || 0))) / 100))
  return base
}

function formatVND(n?: number | null): string {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('vi-VN').format(n) + '₫' } catch { return `${n}₫` }
}

function basicSpec(vm: VehicleModel): string {
  const bits: string[] = []
  if (vm.brand) bits.push(vm.brand)
  if (vm.modelCode) bits.push(vm.modelCode)
  if (vm.vehicleType) bits.push(vm.vehicleType.toUpperCase())
  if (vm.vehicleSubType) bits.push(vm.vehicleSubType)
  if (typeof vm.capacity === 'number') bits.push(`${vm.capacity} chỗ`)
  if (vm.fuelType) bits.push(vm.fuelType)
  return bits.join(' • ')
}

/* ======================= Coercer & Normalizer ======================= */

/** Ăn nhiều schema khác nhau cho modelDiscounts */
// ==== helpers cho TS ====
type AnyRec = Record<string, any>;
const isRecord = (x: unknown): x is AnyRec => typeof x === 'object' && x !== null;

// ==== coerces nhiều schema khác nhau về ProgramModelDiscount[] ====
function coerceModelDiscounts(raw: unknown, rawDocForLog?: unknown): ProgramModelDiscount[] {
  const out: ProgramModelDiscount[] = [];

  // push an toàn, nhận mọi loại input
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
        modelId?.model?.id || modelId?.modelRef?.id
      ));

    if (!mid || typeof mid !== 'string') {
      warn('⛔ drop item — missing modelId', { ctx });
      return;
    }

    let type: 'fixed' | 'percentage' | undefined =
      (discountType === 'fixed' || discountType === 'percentage') ? discountType : undefined;

    let val = (typeof discountValue === 'number') ? discountValue : NaN;

    // Đoán type/value từ ctx nếu chưa có
    if (!type) {
      if (isRecord(ctx)) {
        if (typeof (ctx.percentage ?? ctx.pct ?? ctx.off) === 'number') {
          type = 'percentage';
          val = Number(ctx.percentage ?? ctx.pct ?? ctx.off);
        } else if (typeof (ctx.finalPrice ?? ctx.price ?? ctx.fixed) === 'number') {
          type = 'fixed';
          val = Number(ctx.finalPrice ?? ctx.price ?? ctx.fixed);
        } else if (
          (ctx.type === 'fixed' || ctx.type === 'percentage') &&
          typeof ctx.value === 'number'
        ) {
          type = ctx.type;
          val = Number(ctx.value);
        }
      } else if (typeof ctx === 'number') {
        // số trần → ≤100% coi là percentage, còn lại fixed (final price)
        type = ctx <= 100 ? 'percentage' : 'fixed';
        val = Number(ctx);
      }
    }

    if (type !== 'fixed' && type !== 'percentage') type = 'fixed';
    if (Number.isNaN(val)) val = 0;

    out.push({ modelId: mid, discountType: type, discountValue: val });
  };

  // 1) ARRAY?
  if (Array.isArray(raw)) {
    (raw as unknown[]).forEach((it, idx) => {
      if (typeof it === 'string') {
        push(it, 'fixed', 0, it);
      } else if (isRecord(it)) {
        // 👇 Ép kiểu trước khi đọc thuộc tính
        push(it, it.discountType, it.discountValue, it);
      } else {
        warn('⛔ unknown array item in modelDiscounts', { idx, it });
      }
    });
    log('coerceModelDiscounts[array] →', out.length, out.slice(0, 5));
    return out;
  }

  // 2) OBJECT map?  { [modelId]: number | {…} }
  if (isRecord(raw)) {
    Object.entries(raw as AnyRec).forEach(([k, v]) => {
      if (typeof v === 'number') {
        push(k, undefined, undefined, v);
      } else if (isRecord(v)) {
        // 👇 Ép kiểu trước khi đọc thuộc tính
        push({ modelId: k }, v.discountType, v.discountValue, v);
      } else {
        warn('⛔ unknown map value in modelDiscounts', { modelId: k, v });
      }
    });

    // fallback: schema cũ đặt ở key khác
    if (!out.length && isRecord(rawDocForLog)) {
      const fb = (rawDocForLog.models || rawDocForLog.vehicleModels) as unknown;
      if (Array.isArray(fb) && fb.length) {
        log('coerceModelDiscounts: fallback models[]', fb);
        fb.forEach((x) => push(x as any, 'fixed', 0, x));
      }
    }

    log('coerceModelDiscounts[map] →', out.length, out.slice(0, 5));
    return out;
  }

  warn('⛔ modelDiscounts has unknown shape', raw);
  return out;
}


function normalizeProgram(raw: any): Program & {
  modelDiscounts: ProgramModelDiscount[]
  stationTargets: { stationId: string }[]
} {
  const modelDiscounts = coerceModelDiscounts(raw?.modelDiscounts, raw)
  const stationTargets = toArray<{ stationId: string }>(raw?.stationTargets)
    .filter((x) => x && typeof x.stationId === 'string')

  log('[normalizeProgram]', raw?.id, '→ mds len =', modelDiscounts.length, 'sts len =', stationTargets.length)

  return {
    ...(raw as Program),
    modelDiscounts,
    stationTargets,
  }
}

/* ======================= Firestore loaders (with logs) ======================= */

/** 1) Lấy các Program mà agent đã JOINED */
async function loadJoinedProgramsForAgent(agentId: string): Promise<
  (Program & { modelDiscounts: ProgramModelDiscount[]; stationTargets: { stationId: string }[] })[]
> {
  log('loadJoinedProgramsForAgent:start', { agentId })
  const pSnap = await getDocs(
    query(
      collection(db, 'programParticipants'),
      where('userId', '==', agentId),
      where('userRole', '==', 'agent'),
      where('status', '==', 'joined')
    )
  )
  log('programParticipants count=', pSnap.size)
  if (DEBUG) {
    const rows = pSnap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() }))
    console.table(rows)
  }

  const programIds = Array.from(
    new Set(pSnap.docs.map(d => (d.data() as any)?.programId).filter(Boolean))
  )
  log('programIds:', programIds)

  if (!programIds.length) return []

  // Load programs theo batch 10
  const all: (Program & { modelDiscounts: ProgramModelDiscount[]; stationTargets: { stationId: string }[] })[] = []
  for (const ids of chunk(programIds, 10)) {
    log('programs batch size=', ids.length, 'for ids=', ids)
    const ps = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', ids)))
    log('programs batch snapshot size=', ps.size, 'for batch', ids)
    ps.docs.forEach((d) => {
      const raw = { id: d.id, ...(d.data() as any) }
      const n = normalizeProgram(raw)
      all.push(n)
    })
  }

  log('programs total loaded=', all.length)
  const active = all.filter(isProgramActiveNow)
  log('programs active=', active.length)

  const withModels = active.filter(p => Array.isArray(p.modelDiscounts) && p.modelDiscounts.length > 0)
  if (!withModels.length) {
    warn('No program contains modelDiscounts after normalize. Check keys modelId/vehicleModelId/id…')
  } else {
    withModels.forEach((p) => {
      log('PROGRAM OK:', (p as any).id, p.title, 'modelDiscounts:', p.modelDiscounts.length)
      console.table(p.modelDiscounts.map((md: any) => ({
        modelId: md.modelId, type: md.discountType, val: md.discountValue
      })))
    })
  }

  return withModels
}

/** 2) Load VehicleModels theo id */
async function loadVehicleModelsByIds(modelIds: string[], vehicleModelCollectionName: string): Promise<Map<string, VehicleModel>> {
  log('loadVehicleModelsByIds:start', { count: modelIds.length, vehicleModelCollectionName })
  const map = new Map<string, VehicleModel>()
  if (!modelIds.length) return map
  for (const c of chunk(modelIds, 10)) {
    log('vehicleModels batch size=', c.length, c)
    const snap = await getDocs(query(collection(db, vehicleModelCollectionName), where(documentId(), 'in', c)))
    log('vehicleModels batch snapshot size=', snap.size)
    if (DEBUG) {
      const rows = snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() }))
      console.table(rows)
    }
    snap.docs.forEach((d) => {
      map.set(d.id, { id: d.id, ...(d.data() as any) } as VehicleModel)
    })
  }
  log('vehicleModels total mapped=', map.size)
  return map
}

/** 3) (Optional) Load tên trạm nếu muốn hiển thị “trạm” theo stationTargets */
async function loadStationNamesByIds(stationIds: string[], stationCollectionName: string): Promise<Map<string, string>> {
  log('loadStationNamesByIds:start', { count: stationIds.length, stationCollectionName })
  const map = new Map<string, string>()
  if (!stationIds.length) return map
  for (const c of chunk(stationIds, 10)) {
    const snap = await getDocs(query(collection(db, stationCollectionName), where(documentId(), 'in', c)))
    log('stations batch snapshot size=', snap.size)
    snap.docs.forEach((d) => {
      const data = d.data() as any
      map.set(d.id, data?.name || d.id)
    })
  }
  log('station names mapped=', map.size)
  return map
}

/* ======================= View Types ======================= */
type Row = {
  key: string
  programId: string
  programTitle: string
  modelId: string
  model?: VehicleModel
  modelDiscount?: ProgramModelDiscount
  stationNames: string[] // [] = tất cả trạm
}

/* ======================= Component ======================= */

interface Props {
  agentId: string
  vehicleModelCollectionName?: string   // default 'vehicleModels'
  stationCollectionName?: string       // default 'rentalStations'
}

export default function AgentJoinedModelsTable({
  agentId,
  vehicleModelCollectionName = 'vehicleModels',
  stationCollectionName = 'rentalStations',
}: Props) {
  const { t } = useTranslation('common', { useSuspense: false })
  const [rows, setRows] = React.useState<Row[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        log('MOUNT props:', { agentId, vehicleModelCollectionName, stationCollectionName })
        setLoading(true)

        // 1) Programs mà agent đã JOINED (normalized + filter active)
        const programs = await loadJoinedProgramsForAgent(agentId)
        if (!mounted) return

        log('Programs (post-filter) count=', programs.length)
        if (!programs.length) {
          setRows([])
          setLoading(false)
          return
        }

        // 2) Gom modelIds + stationIds
        const modelIds = new Set<string>()
        const stationIds = new Set<string>()
        programs.forEach((p) => {
          const mds: ProgramModelDiscount[] = Array.isArray((p as any).modelDiscounts)
            ? (p as any).modelDiscounts
            : coerceModelDiscounts((p as any).modelDiscounts, p)

          mds.forEach((md) => md?.modelId && modelIds.add(md.modelId))

          const sts = Array.isArray((p as any).stationTargets)
            ? (p as any).stationTargets
            : toArray((p as any).stationTargets)

          sts.forEach((st: any) => st?.stationId && stationIds.add(st.stationId))
        })
        log('Unique modelIds count=', modelIds.size, [...modelIds].slice(0, 20))
        log('Unique stationIds count=', stationIds.size, [...stationIds].slice(0, 20))

        // 3) Load VehicleModels + Station names
        const [modelMap, stationNameMap] = await Promise.all([
          loadVehicleModelsByIds([...modelIds], vehicleModelCollectionName),
          loadStationNamesByIds([...stationIds], stationCollectionName),
        ])
        if (!mounted) return

        // 4) Build rows
        const built: Row[] = []
        programs.forEach((p) => {
          const stationNames =
            (Array.isArray((p as any).stationTargets) && (p as any).stationTargets.length
              ? (p as any).stationTargets.map((st: any) => stationNameMap.get(st.stationId)).filter(Boolean)
              : []) as string[] // [] = all stations

          const mds: ProgramModelDiscount[] = Array.isArray((p as any).modelDiscounts)
            ? (p as any).modelDiscounts
            : coerceModelDiscounts((p as any).modelDiscounts, p)

          mds.forEach((md) => {
            const vm = modelMap.get(md.modelId)
            if (!vm) warn('VehicleModel NOT FOUND:', md.modelId, 'program:', (p as any).id)
            built.push({
              key: `${(p as any).id}:${md.modelId}`,
              programId: (p as any).id,
              programTitle: p.title,
              modelId: md.modelId,
              model: vm,
              modelDiscount: md,
              stationNames,
            })
          })
        })

        log('Built rows count=', built.length)
        if (DEBUG && built.length) {
          console.table(built.slice(0, 10).map(b => ({
            key: b.key,
            programTitle: b.programTitle,
            model: b.model?.name || b.modelId,
            discountType: b.modelDiscount?.discountType,
            discountValue: b.modelDiscount?.discountValue,
            stations: b.stationNames.join(', ') || '(all)',
          })))
        }

        // 5) Sort theo tên xe
        built.sort((a, b) => (a.model?.name || '').localeCompare(b.model?.name || ''))
        setRows(built)
        setLoading(false)
      } catch (e: any) {
        err('load error', e)
        setError(e?.message || 'Load failed')
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [agentId, vehicleModelCollectionName, stationCollectionName])

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

  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">{t('agent_joined_models.model', 'Tên xe')}</TableHead>
            <TableHead className="min-w-[280px]">{t('agent_joined_models.spec', 'Cấu hình cơ bản')}</TableHead>
            <TableHead className="min-w-[200px]">{t('agent_joined_models.price', 'Giá cho thuê')}</TableHead>
            <TableHead className="min-w-[220px]">{t('agent_joined_models.station', 'Trạm')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const vm = r.model
            const base = vm ? pickBasePrice(vm) : { label: '', value: null }
            const finalPrice = applyDiscount(base.value, r.modelDiscount)

            return (
              <TableRow key={r.key}>
                <TableCell>
                  <div className="font-medium">{vm?.name || r.modelId}</div>
                  <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {r.programTitle}
                  </div>
                </TableCell>

                <TableCell>
                  {vm ? (
                    <div className="text-sm text-gray-700">{basicSpec(vm)}</div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {finalPrice != null ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatVND(finalPrice)}</span>
                      {base.value != null && finalPrice !== base.value && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatVND(base.value)}{base.label ? `/${base.label}` : ''}
                        </span>
                      )}
                      {base.value != null && finalPrice === base.value && (
                        <span className="text-xs text-gray-500">
                          {base.label ? `/${base.label}` : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {r.stationNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.stationNames.slice(0, 2).map((name) => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))}
                      {r.stationNames.length > 2 && (
                        <Badge variant="secondary">+{r.stationNames.length - 2}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600">
                      {t('agent_joined_models.all_stations', 'Tất cả trạm')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
