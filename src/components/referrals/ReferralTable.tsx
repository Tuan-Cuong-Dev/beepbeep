'use client';

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import type { AgentReferral } from '@/src/lib/agents/referralTypes';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

type NameMap = Record<string, string>;

type Props = {
  rows: AgentReferral[];
  pageSize?: number;

  /** Map id -> name để hiển thị “tên” thay vì id */
  companyNameMap?: NameMap;
  stationNameMap?: NameMap;
  programNameMap?: NameMap;

  onView?: (r: AgentReferral) => void;
  onEdit?: (r: AgentReferral) => void;
  onDelete?: (r: AgentReferral) => void;
};

function maskPhone(p?: string) {
  if (!p) return '—';
  const d = p.replace(/[^\d]/g, '');
  if (d.length <= 6) return d;
  return d.slice(0, 3) + '***' + d.slice(-3);
}

function StatusBadge({ s }: { s: AgentReferral['status'] }) {
  const map: Record<AgentReferral['status'], string> = {
    new: 'bg-blue-50 text-blue-700',
    contacted: 'bg-amber-50 text-amber-700',
    converted: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };
  const label: Record<AgentReferral['status'], string> = {
    new: 'Mới',
    contacted: 'Đã liên hệ',
    converted: 'Đã chuyển đổi',
    rejected: 'Từ chối',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[s]}`}>{label[s]}</span>;
}

const VEHICLE_LABEL: Record<NonNullable<AgentReferral['vehicleType']>, string> = {
  bike: 'Xe đạp',
  motorbike: 'Xe máy',
  car: 'Ô tô',
  van: 'Xe van',
  bus: 'Xe buýt',
  other: 'Khác',
};

export default function ReferralTable({
  rows,
  pageSize = 10,
  companyNameMap,
  stationNameMap,
  programNameMap,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<
    'createdAt' | 'status' | 'fullName' | 'companyName' | 'programName'
  >('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const nameOf = (id?: string | null, m?: NameMap) => (id ? (m?.[id] || id) : '—');

  const enriched = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      _companyName: nameOf(r.companyId, companyNameMap),
      _stationName: nameOf(r.stationId, stationNameMap),
      _programName: nameOf(r.programId ?? undefined, programNameMap),
      _createdMs: (r.createdAt as any)?.toMillis?.() ?? 0,
    }));
  }, [rows, companyNameMap, stationNameMap, programNameMap]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'createdAt':
          va = a._createdMs; vb = b._createdMs; break;
        case 'companyName':
          va = a._companyName || ''; vb = b._companyName || ''; break;
        case 'programName':
          va = a._programName || ''; vb = b._programName || ''; break;
        default:
          va = (a as any)[sortKey] ?? '';
          vb = (b as any)[sortKey] ?? '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [enriched, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey !== k) { setSortKey(k); setSortDir('asc'); return; }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  const Desktop = () => (
    <div className="hidden md:block w-full overflow-x-auto rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px] cursor-pointer" onClick={() => toggleSort('createdAt')}>Ngày tạo</TableHead>
            <TableHead className="min-w-[160px] cursor-pointer" onClick={() => toggleSort('fullName')}>Khách hàng</TableHead>
            <TableHead className="min-w-[120px]">SĐT</TableHead>

            <TableHead className="min-w-[200px] cursor-pointer" onClick={() => toggleSort('companyName')}>
              Công ty / Trạm
            </TableHead>

            <TableHead className="min-w-[180px] cursor-pointer" onClick={() => toggleSort('programName')}>
              Chương trình
            </TableHead>

            <TableHead className="min-w-[120px]">Kênh</TableHead>
            <TableHead className="min-w-[120px]">Loại xe</TableHead>
            <TableHead className="min-w-[110px]">Ngôn ngữ</TableHead>
            <TableHead className="min-w-[120px]">Nguồn</TableHead>
            <TableHead className="min-w-[90px]">Liên hệ</TableHead>

            <TableHead className="min-w-[120px] cursor-pointer" onClick={() => toggleSort('status')}>Trạng thái</TableHead>
            <TableHead className="min-w-[130px]">Dự kiến thuê</TableHead>
            <TableHead className="min-w-[130px]">Hoa hồng</TableHead>
            <TableHead className="min-w-[160px]" style={{ textAlign: 'right' }}>Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pageRows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{safeFormatDate(r.createdAt as any, 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell className="font-medium">{r.fullName}</TableCell>
              <TableCell>{maskPhone(r.phone)}</TableCell>

              <TableCell>
                <div className="text-sm">{nameOf(r.companyId, companyNameMap)}</div>
                <div className="text-xs text-gray-500">{nameOf(r.stationId, stationNameMap)}</div>
              </TableCell>

              <TableCell className="text-sm">{nameOf(r.programId ?? undefined, programNameMap)}</TableCell>

              <TableCell className="text-sm">{r.contactChannel || '—'}</TableCell>
              <TableCell className="text-sm">
                {r.vehicleType ? VEHICLE_LABEL[r.vehicleType] : '—'}
              </TableCell>
              <TableCell className="text-sm">{r.preferredLanguage?.toUpperCase?.() || '—'}</TableCell>
              <TableCell className="text-sm">{r.sourceTag || '—'}</TableCell>
              <TableCell className="text-sm">{r.consentContact === false ? '✖' : '✔'}</TableCell>

              <TableCell><StatusBadge s={r.status} /></TableCell>

              <TableCell>
                {r.expectedStart ? safeFormatDate(r.expectedStart as any, 'dd/MM/yyyy') : '—'}
              </TableCell>

              <TableCell>
                {typeof r.commissionAmount === 'number'
                  ? r.commissionAmount.toLocaleString('vi-VN') + '₫'
                  : '—'}
              </TableCell>

              <TableCell style={{ textAlign: 'right' }}>
                <div className="flex justify-end gap-2">
                  {onView && <Button variant="outline" size="sm" onClick={() => onView(r)}>Xem</Button>}
                  {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(r)}>Sửa</Button>}
                  {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(r)}>Xoá</Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-gray-600">
          Trang {page}/{totalPages} • Tổng {rows.length}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      </div>
    </div>
  );

  const Mobile = () => (
    <div className="md:hidden grid grid-cols-1 gap-3">
      {pageRows.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-3">
            <div className="text-xs text-gray-500">{safeFormatDate(r.createdAt as any, 'dd/MM/yyyy HH:mm')}</div>
            <div className="text-base font-semibold">{r.fullName}</div>
            <div className="text-sm text-gray-700">{maskPhone(r.phone)}</div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>🏢 {nameOf(r.companyId, companyNameMap)}</div>
              <div>🚏 {nameOf(r.stationId, stationNameMap)}</div>
              <div>🎯 {nameOf(r.programId ?? undefined, programNameMap)}</div>
              <div>📞 {r.contactChannel || '—'}</div>
              <div>🚘 {r.vehicleType ? VEHICLE_LABEL[r.vehicleType] : '—'}</div>
              <div>🌐 {r.preferredLanguage?.toUpperCase?.() || '—'}</div>
              <div>🏷️ {r.sourceTag || '—'}</div>
              <div>✅ {r.consentContact === false ? '✖' : '✔'}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge s={r.status} />
              <span className="text-xs text-gray-600">
                Dự kiến: <b>{r.expectedStart ? safeFormatDate(r.expectedStart as any, 'dd/MM/yyyy') : '—'}</b>
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                {typeof r.commissionAmount === 'number'
                  ? r.commissionAmount.toLocaleString('vi-VN') + '₫'
                  : '—'}
              </span>
            </div>

            {(onView || onEdit || onDelete) && (
              <div className="mt-3 flex justify-end gap-2">
                {onView && <Button variant="outline" size="sm" onClick={() => onView(r)}>Xem</Button>}
                {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(r)}>Sửa</Button>}
                {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(r)}>Xoá</Button>}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="text-xs text-gray-600">
          Trang {page}/{totalPages} • Tổng {rows.length}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Mobile />
      <Desktop />
    </div>
  );
}
