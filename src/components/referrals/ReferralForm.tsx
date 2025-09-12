'use client';

import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';

import { useAgentOptions } from '@/src/hooks/useAgentOptions';
import type { AgentReferral, ContactChannel, PreferredLanguage, VehicleType } from '@/src/lib/agents/referralTypes'; // cập nhật đúng path

type FormValue = {
  fullName: string;
  phone: string;
  note?: string;
  companyId?: string;
  stationId?: string;
  expectedStart?: Date | null;
  vehicleType?: VehicleType;
  modelHint?: string;
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage;
  programId?: string | null;
  sourceTag?: string;
  consentContact?: boolean;
};

type Props = {
  agentId: string;
  initial?: Partial<FormValue>;
  submitting?: boolean;
  onSubmit: (val: FormValue) => Promise<void> | void;
};

const VEHICLE_TYPE_OPTIONS = [
  { value: 'bike', label: 'Xe đạp' },
  { value: 'motorbike', label: 'Xe máy / Xe máy điện' },
  { value: 'car', label: 'Ô tô' },
  { value: 'van', label: 'Xe van' },
  { value: 'bus', label: 'Xe buýt' },
  { value: 'other', label: 'Khác' },
] as const;

export default function ReferralForm({ agentId, initial, submitting, onSubmit }: Props) {
  const { companyOptions, programOptions, modelOptions, getStationOptionsForCompany, loading: optLoading } =
    useAgentOptions({ agentId });

  const [form, setForm] = useState<FormValue>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    note: initial?.note ?? '',
    companyId: initial?.companyId ?? '',
    stationId: initial?.stationId ?? '',
    expectedStart: initial?.expectedStart ?? null,
    vehicleType: initial?.vehicleType ?? 'motorbike',
    modelHint: initial?.modelHint ?? '',
    contactChannel: initial?.contactChannel ?? 'Zalo',
    preferredLanguage: initial?.preferredLanguage ?? 'vi',
    programId: initial?.programId ?? null,
    sourceTag: initial?.sourceTag ?? 'HotelLobby',
    consentContact: initial?.consentContact ?? true,
  });

  const setF = <K extends keyof FormValue>(k: K, v: FormValue[K]) => setForm((p) => ({ ...p, [k]: v }));

  const stationOptions = useMemo(
    () => getStationOptionsForCompany(form.companyId || ''),
    [form.companyId, getStationOptionsForCompany]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Họ tên *</label>
          <Input value={form.fullName} onChange={(e) => setF('fullName', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-gray-600">Số điện thoại *</label>
          <Input value={form.phone} onChange={(e) => setF('phone', e.target.value)} required />
        </div>
      </div>

      {/* Company / Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Công ty</label>
          <SimpleSelect
            className="h-10"
            options={companyOptions}
            value={form.companyId || ''}
            onChange={(v) => {
              setF('companyId', (v || '') as string);
              setF('stationId', '');
            }}
            placeholder={optLoading ? 'Đang tải…' : 'Chọn công ty'}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Trạm</label>
          <SimpleSelect
            className="h-10"
            options={stationOptions}
            value={form.stationId || ''}
            onChange={(v) => setF('stationId', (v || '') as string)}
            disabled={!form.companyId}
            placeholder={!form.companyId ? 'Chọn công ty trước' : optLoading ? 'Đang tải…' : 'Chọn trạm'}
          />
        </div>
      </div>

      {/* Time / Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:space-x-4">
          <label className="text-sm text-gray-600">Ngày dự kiến thuê</label>
          <DatePicker
            selected={form.expectedStart ?? null}
            onChange={(d) => setF('expectedStart', d)}
            className="w-full rounded border px-3 py-2"
            placeholderText="Chọn ngày"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Loại phương tiện</label>
          <SimpleSelect
            className="h-10"
            options={VEHICLE_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
            value={form.vehicleType || 'motorbike'}
            onChange={(v) => setF('vehicleType', (v || 'motorbike') as VehicleType)}
            placeholder="Chọn loại"
          />
        </div>
      </div>

      {/* Model hint / Program */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Gợi ý mẫu xe</label>
          <input
            list="agent-models"
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.modelHint || ''}
            onChange={(e) => setF('modelHint', e.target.value)}
            placeholder="Chọn/nhập mẫu xe"
          />
          <datalist id="agent-models">
            {modelOptions.map((o) => (
              <option key={o.value} value={o.label} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-sm text-gray-600">Chương trình</label>
          <SimpleSelect
            className="h-10"
            options={programOptions}
            value={form.programId || ''}
            onChange={(v) => setF('programId', (v || null) as string | null)}
            placeholder={optLoading ? 'Đang tải…' : 'Chọn chương trình'}
          />
        </div>
      </div>

      {/* Channel / Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Kênh liên lạc</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.contactChannel || 'Zalo'}
            onChange={(e) => setF('contactChannel', e.target.value as ContactChannel)}
          >
            <option>Zalo</option><option>WhatsApp</option><option>Call</option>
            <option>WeChat</option><option>KakaoTalk</option>
            <option>Facebook</option><option>Instagram</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Ngôn ngữ</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.preferredLanguage || 'vi'}
            onChange={(e) => setF('preferredLanguage', e.target.value as PreferredLanguage)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="ko">한국어</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      {/* Tags / Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Nguồn (tag)</label>
          <Input
            value={form.sourceTag || ''}
            onChange={(e) => setF('sourceTag', e.target.value)}
            placeholder="HotelLobby / Showroom / Event / ..."
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Ghi chú</label>
          <Textarea value={form.note || ''} onChange={(e) => setF('note', e.target.value)} rows={3} />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.consentContact}
          onChange={(e) => setF('consentContact', e.target.checked)}
        />
        Tôi đồng ý cho phép liên hệ để xác nhận & tư vấn.
      </label>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={submitting} className="h-10">
          {submitting ? 'Đang gửi…' : 'Lưu'}
        </Button>
      </div>
    </form>
  );
}
