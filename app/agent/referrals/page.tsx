'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection, getDocs, query, where, documentId, Timestamp
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';

import ReferralForm from '@/src/components/referrals/ReferralForm';
import ReferralSearch, { ReferralFilters } from '@/src/components/referrals/ReferralSearch';
import ReferralTable from '@/src/components/referrals/ReferralTable';

import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';

import { useUser } from '@/src/context/AuthContext';
import { useAgentOptions } from '@/src/hooks/useAgentOptions';
import { useAgentReferrals } from '@/src/hooks/useAgentReferrals';
import { db } from '@/src/firebaseConfig';

import type { AgentReferral } from '@/src/lib/agents/referralTypes';

/* ================= Utils ================= */
function tsToMillis(t?: Timestamp | null) {
  if (!t) return 0;
  try { return t.toMillis?.() ?? 0; } catch { return 0; }
}
function chunk<T>(arr: T[], size = 10) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
const shallowEqual = (a: Record<string, string>, b: Record<string, string>) => {
  if (a === b) return true;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
};

/* ================= Station name cache (memory + localStorage) ================= */
const STATION_CACHE_KEY = 'stationNameCache:v1';
const stationNameCache = new Map<string, string>();

function hydrateStationCache() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STATION_CACHE_KEY) : null;
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, string>;
    Object.entries(obj).forEach(([k, v]) => stationNameCache.set(k, v));
  } catch {}
}
function persistStationCache() {
  try {
    if (typeof window === 'undefined') return;
    const obj = Object.fromEntries(stationNameCache.entries());
    localStorage.setItem(STATION_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

/* ================= Page ================= */
export default function ReferralManagementPage() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const agentId = user?.uid || '';

  // Date | null -> Firestore Timestamp (hoặc null)
  const toFsTime = (d?: Date | null) => (d ? Timestamp.fromDate(d) : null);

  const { items, loading, create, updateReferral, remove } = useAgentReferrals(agentId);
  const { companyOptions } = useAgentOptions({ agentId });

  // Maps: id -> name
  const [companyNameMap, setCompanyNameMap] = useState<Record<string, string>>({});
  const [stationNameMap, setStationNameMap] = useState<Record<string, string>>({});
  const [programNameMap, setProgramNameMap] = useState<Record<string, string>>({});

  // Company map từ options
  useEffect(() => {
    const next = Object.fromEntries(companyOptions.map((o) => [o.value, o.label]));
    setCompanyNameMap((prev) => (shallowEqual(prev, next) ? prev : next));
  }, [companyOptions]);

  // --- Station name: hydrate cache 1 lần + seed state để hiển thị tên ngay
  useEffect(() => {
    hydrateStationCache();
    setStationNameMap((prev) => ({ ...Object.fromEntries(stationNameCache), ...prev }));
  }, []);

  // Gom tất cả stationId đang có trong items (có thể đổi thành pageRows nếu muốn lazy)
  const stationIdsInItems = useMemo(
    () => Array.from(new Set(items.map((r) => r.stationId).filter(Boolean) as string[])),
    [items]
  );

  // Fetch những stationId chưa có trong cache (chunk 10)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = stationIdsInItems.filter((id) => !stationNameCache.has(id));
      if (missing.length === 0) return;

      const newEntries: [string, string][] = [];
      for (const part of chunk(missing, 10)) {
        const snap = await getDocs(
          query(collection(db, 'rentalStations'), where(documentId(), 'in', part))
        );
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const name = (data?.name as string) || d.id;
          stationNameCache.set(d.id, name);
          newEntries.push([d.id, name]);
        });
      }
      if (cancelled) return;
      if (newEntries.length) {
        setStationNameMap((prev) => ({ ...prev, ...Object.fromEntries(newEntries) }));
        persistStationCache();
      }
    })();
    return () => { cancelled = true; };
  }, [stationIdsInItems]);

  // Program map theo ids từ items
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = Array.from(new Set(items.map((r) => r.programId).filter(Boolean) as string[]));
      if (ids.length === 0) { if (!cancelled) setProgramNameMap({}); return; }
      const map: Record<string, string> = {};
      for (const part of chunk(ids, 10)) {
        const snap = await getDocs(query(collection(db, 'programs'), where(documentId(), 'in', part)));
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          map[d.id] = (data.title as string) || d.id;
        });
      }
      if (!cancelled) setProgramNameMap(map);
    })();
    return () => { cancelled = true; };
  }, [items]);

  /* ---------- Filters + pagination ---------- */
  const [filters, setFilters] = useState<ReferralFilters>({
    q: '',
    status: 'all',
    from: null,
    to: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const filtered = useMemo(() => {
    const q = (filters.q || '').trim().toLowerCase();
    const fromMs = filters.from ? filters.from.getTime() : null;
    const toMs = filters.to ? (filters.to.getTime() + 24 * 60 * 60 * 1000 - 1) : null;
    return items.filter((r) => {
      if (q) {
        const hay = `${r.fullName || ''} ${r.phone || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;

      const created = tsToMillis(r.createdAt);
      if (fromMs != null && created < fromMs) return false;
      if (toMs != null && created > toMs) return false;

      return true;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  /* ---------- Dialog & Edit mode ---------- */
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });
  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    description = ''
  ) => setDialog({ open: true, type, title, description, onConfirm: undefined });

  const [editing, setEditing] = useState<AgentReferral | null>(null);
  const isUpdateMode = !!editing;

  // Scroll tới form khi bấm "Sửa"
  const formRef = useRef<HTMLDivElement>(null);
  const handleEdit = (r: AgentReferral) => {
    setEditing(r);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = formRef.current?.querySelector<HTMLInputElement>('input, textarea, select');
      input?.focus();
    });
  };

  const handleDelete = (id: string) => {
    setDialog({
      open: true,
      type: 'confirm',
      title: t('referrals.delete_title', { defaultValue: 'Xoá lead?' }),
      description: t('referrals.delete_confirm', { defaultValue: 'Bạn chắc chắn muốn xoá lead này?' }),
      onConfirm: async () => {
        try {
          await remove(id);
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', t('referrals.delete_success', { defaultValue: 'Đã xoá lead.' }));
        } catch (e) {
          console.error(e);
          showDialog('error', t('referrals.delete_failed', { defaultValue: 'Không thể xoá lead.' }));
        }
      },
    });
  };

  /* ---------- Render ---------- */
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <div className="p-6 mt-1">
        <h1 className="text-2xl font-semibold mb-4 border-b-2 pb-2">
          {t('referrals.title', { defaultValue: 'Quản lý giới thiệu khách hàng' })}
        </h1>

        {/* Search / Filters (đơn giản) */}
        <ReferralSearch
          initial={filters}
          onChange={(f) => setFilters(f)}
        />

        {/* Table */}
        <div className="mt-4">
          <ReferralTable
            rows={pageRows}
            companyNameMap={companyNameMap}
            stationNameMap={stationNameMap}
            programNameMap={programNameMap}
            onEdit={handleEdit}
            onDelete={(r) => handleDelete(r.id)}
          />

          {loading && (
            <div className="mt-2 text-sm text-gray-500">
              {t('loading', { defaultValue: 'Đang tải danh sách…' })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>

        {/* Form */}
        <div ref={formRef} className="mt-6 bg-white rounded-2xl border p-4">
          <h2 className="text-lg font-semibold mb-3">
            {isUpdateMode
              ? t('referrals.edit_title', { defaultValue: 'Cập nhật giới thiệu' })
              : t('referrals.create_title', { defaultValue: 'Tạo giới thiệu' })}
          </h2>

          <ReferralForm
            key={editing?.id ?? 'create'}  // remount khi chuyển edit/create
            agentId={agentId}
            initial={isUpdateMode ? {
              fullName: editing?.fullName,
              phone: editing?.phone,
              note: editing?.note,
              companyId: editing?.companyId,
              stationId: editing?.stationId,
              expectedStart: editing?.expectedStart
                ? new Date(tsToMillis(editing.expectedStart))
                : undefined,
              vehicleType: editing?.vehicleType,
              modelHint: editing?.modelHint,
              contactChannel: editing?.contactChannel,
              preferredLanguage: editing?.preferredLanguage,
              programId: editing?.programId ?? null,
              sourceTag: editing?.sourceTag,
              consentContact: editing?.consentContact ?? true,
            } : undefined}
            submitting={false}
            onSubmit={async (val) => {
              try {
                if (isUpdateMode && editing) {
                  await updateReferral(editing.id, {
                    fullName: val.fullName,
                    phone: val.phone,
                    note: val.note,
                    companyId: val.companyId,
                    stationId: val.stationId,
                    expectedStart: toFsTime(val.expectedStart),
                    vehicleType: val.vehicleType,
                    modelHint: val.modelHint,
                    contactChannel: val.contactChannel,
                    preferredLanguage: val.preferredLanguage,
                    programId: val.programId ?? null,
                    sourceTag: val.sourceTag,
                    consentContact: val.consentContact,
                  });
                  setEditing(null);
                  showDialog('success', t('referrals.update_success', { defaultValue: 'Đã cập nhật lead.' }));
                } else {
                  const id = await create({
                    fullName: val.fullName,
                    phone: val.phone,
                    note: val.note,
                    companyId: val.companyId,
                    stationId: val.stationId,
                    expectedStart: toFsTime(val.expectedStart),
                    vehicleType: val.vehicleType,
                    modelHint: val.modelHint,
                    contactChannel: val.contactChannel,
                    preferredLanguage: val.preferredLanguage,
                    programId: val.programId ?? null,
                    sourceTag: val.sourceTag,
                    consentContact: val.consentContact,
                    source: 'agent_form',
                    meta: { byAgentId: agentId, preferredLanguage: val.preferredLanguage, sourceTag: val.sourceTag },
                  });
                  if (id) {
                    showDialog('success', t('referrals.create_success', { defaultValue: 'Đã tạo giới thiệu.' }));
                  }
                }
              } catch (e) {
                console.error(e);
                showDialog('error', t('referrals.mutate_failed', { defaultValue: 'Thao tác không thành công.' }));
              }
            }}
          />

          {isUpdateMode && (
            <div className="mt-3">
              <button
                className="text-sm text-gray-600 underline"
                onClick={() => setEditing(null)}
              >
                {t('referrals.cancel_edit', { defaultValue: 'Huỷ chỉnh sửa' })}
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
