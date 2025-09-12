'use client';

import { useEffect, useState } from 'react';
import { SimpleSelect } from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import type { ReferralStatus } from '@/src/lib/agents/referralTypes';

export type ReferralFilters = {
  q?: string;                         // name/phone
  status?: ReferralStatus | 'all';
  from?: Date | null;
  to?: Date | null;
};

type Props = {
  onChange: (f: ReferralFilters) => void;
  initial?: Partial<ReferralFilters>;
};

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'converted', label: 'Đã chuyển đổi' },
  { value: 'rejected', label: 'Từ chối' },
];

export default function ReferralSearch({ onChange, initial }: Props) {
  const [f, setF] = useState<ReferralFilters>({
    q: initial?.q ?? '',
    status: initial?.status ?? 'all',
    from: initial?.from ?? null,
    to: initial?.to ?? null,
  });

  // Auto-swap if from > to (tránh khoảng thời gian ngược)
  useEffect(() => {
    if (f.from && f.to && f.from.getTime() > f.to.getTime()) {
      setF((p) => ({ ...p, from: f.to, to: f.from }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.from, f.to]);

  // Debounce emit
  useEffect(() => {
    const t = setTimeout(() => onChange(f), 300);
    return () => clearTimeout(t);
  }, [f, onChange]);

  const resetFilters = () =>
    setF({ q: '', status: 'all', from: null, to: null });

  return (
    <div className="bg-white rounded-2xl border p-3 md:p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="min-w-0">
          <label className="text-sm text-gray-600">Tìm kiếm</label>
          <Input
            className="h-10"
            placeholder="Tên hoặc SĐT…"
            value={f.q || ''}
            onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Trạng thái</label>
          <SimpleSelect
            className="h-10"
            options={STATUS_OPTS}
            value={f.status || 'all'}
            onChange={(v) =>
              setF((p) => ({ ...p, status: (v as ReferralFilters['status']) || 'all' }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Từ ngày</label>
            <DatePicker
              selected={f.from ?? null}
              onChange={(d) => setF((p) => ({ ...p, from: d }))}
              className="mt-1 w-full rounded border px-3 py-2 h-10"
              wrapperClassName="w-full"
              isClearable
              placeholderText="Chọn ngày"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Đến ngày</label>
            <DatePicker
              selected={f.to ?? null}
              onChange={(d) => setF((p) => ({ ...p, to: d }))}
              className="mt-1 w-full rounded border px-3 py-2 h-10"
              wrapperClassName="w-full"
              isClearable
              placeholderText="Chọn ngày"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-gray-600 underline"
          onClick={resetFilters}
        >
          Xóa lọc
        </button>
      </div>
    </div>
  );
}
