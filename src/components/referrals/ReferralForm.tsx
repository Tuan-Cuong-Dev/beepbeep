'use client';

import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

import type {
  ContactChannel,
  PreferredLanguage,
  VehicleType,
} from '@/src/lib/agents/referralTypes';
import { useTranslation } from 'react-i18next';

type SplitPreset = '50_50' | '70_30' | '100_0' | 'custom';

type FormValue = {
  fullName: string;
  phone: string;

  // Quick fields
  expectedStart?: Date | null;
  quantity?: number;           // số lượng xe
  rentalDays?: number;         // số ngày
  vehicleType?: VehicleType;   // cho phép chọn, mặc định 'motorbike'

  stationId?: string;          // nhập nhanh (tùy chọn)
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage;

  teammate?: string;           // tên đồng đội (nếu có)
  splitPreset?: SplitPreset;
  splitSelfPct?: number | null; // khi preset = custom

  attributionLocked?: boolean;
  note?: string;
  sourceTag?: string;          // ví dụ: HotelLobby
};

type Props = {
  agentId: string;
  initial?: Partial<FormValue>;
  submitting?: boolean;
  onSubmit: (val: FormValue) => Promise<void> | void;
};

const VEHICLE_OPTIONS: { value: VehicleType; labelKey: string; defaultLabel: string }[] = [
  { value: 'motorbike', labelKey: 'vehicle.motorbike', defaultLabel: 'Xe máy' },
  { value: 'bike',      labelKey: 'vehicle.bike',      defaultLabel: 'Xe đạp' },
  { value: 'car',       labelKey: 'vehicle.car',       defaultLabel: 'Ô tô' },
  { value: 'van',       labelKey: 'vehicle.van',       defaultLabel: 'Xe van' },
  { value: 'bus',       labelKey: 'vehicle.bus',       defaultLabel: 'Xe buýt' },
  { value: 'other',     labelKey: 'vehicle.other',     defaultLabel: 'Khác' },
];

export default function ReferralForm({ agentId, initial, submitting, onSubmit }: Props) {
  const { t } = useTranslation('common', { useSuspense: false });

  const [form, setForm] = useState<FormValue>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',

    expectedStart: initial?.expectedStart ?? null,
    quantity: initial?.quantity ?? 1,
    rentalDays: initial?.rentalDays ?? 1,
    vehicleType: initial?.vehicleType ?? 'motorbike',

    stationId: initial?.stationId ?? '',
    contactChannel: initial?.contactChannel ?? 'Zalo',
    preferredLanguage: initial?.preferredLanguage ?? 'vi',

    teammate: initial?.teammate ?? '',
    splitPreset: initial?.splitPreset ?? '50_50',
    splitSelfPct: initial?.splitSelfPct ?? 50,

    attributionLocked: initial?.attributionLocked ?? true,
    note: initial?.note ?? '',
    sourceTag: initial?.sourceTag ?? 'HotelLobby',
  });

  const setF = <K extends keyof FormValue>(k: K, v: FormValue[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const showCustomPct = form.splitPreset === 'custom';

  // % của người lập phiếu (Agent)
  const computedSelfPct = useMemo(() => {
    if (showCustomPct) return Math.max(0, Math.min(100, Number(form.splitSelfPct ?? 50)));
    switch (form.splitPreset) {
      case '50_50': return 50;
      case '70_30': return 70;
      case '100_0': return 100;
      default: return 50;
    }
  }, [form.splitPreset, form.splitSelfPct, showCustomPct]);

  const teammatePct = 100 - computedSelfPct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    const payload: FormValue = {
      ...form,
      vehicleType: form.vehicleType || 'motorbike',
      quantity: Math.max(1, Number(form.quantity || 1)),
      rentalDays: Math.max(1, Number(form.rentalDays || 1)),
      splitSelfPct: showCustomPct
        ? Math.max(0, Math.min(100, Number(form.splitSelfPct ?? 50)))
        : computedSelfPct,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1) KHÁCH HÀNG */}
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {t('referrals.form.customer_info', { defaultValue: 'Thông tin khách' })}
          </h3>
          <span className="text-xs text-gray-500">
            {t('referrals.form.required_hint', { defaultValue: '* bắt buộc' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.full_name', { defaultValue: 'Họ tên' })} *
            </label>
            <Input
              value={form.fullName}
              onChange={(e) => setF('fullName', e.target.value)}
              required
              className="mt-1"
              placeholder={t('referrals.form.placeholder_full_name', { defaultValue: 'Nguyễn Văn A' })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.phone', { defaultValue: 'Số điện thoại' })} *
            </label>
            <Input
              value={form.phone}
              onChange={(e) => setF('phone', e.target.value)}
              required
              className="mt-1"
              placeholder={t('referrals.form.placeholder_phone', { defaultValue: '090x xxx xxx' })}
              inputMode="tel"
            />
          </div>
        </div>
      </section>

      {/* 2) CHI TIẾT THUÊ */}
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <h3 className="mb-3 text-base font-semibold">
          {t('referrals.form.rental_details', { defaultValue: 'Chi tiết thuê' })}
        </h3>

        {/* 4 cột trên desktop: Ngày - Loại xe - SL - Số ngày */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.expected_date', { defaultValue: 'Ngày dự kiến' })}
            </label>
            <DatePicker
              selected={form.expectedStart ?? null}
              onChange={(d) => setF('expectedStart', d)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholderText={t('referrals.search.select_date', { defaultValue: 'Chọn ngày' })}
              dateFormat="dd/MM/yyyy"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.vehicle_type', { defaultValue: 'Loại phương tiện' })}
            </label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.vehicleType || 'motorbike'}
              onChange={(e) => setF('vehicleType', e.target.value as VehicleType)}
            >
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey, { defaultValue: opt.defaultLabel })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.quantity', { defaultValue: 'Số lượng xe' })}
            </label>
            <Input
              type="number"
              min={1}
              value={form.quantity ?? 1}
              onChange={(e) => setF('quantity', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.rental_days', { defaultValue: 'Số ngày thuê' })}
            </label>
            <Input
              type="number"
              min={1}
              value={form.rentalDays ?? 1}
              onChange={(e) => setF('rentalDays', Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.station_optional', { defaultValue: 'Trạm (tùy chọn)' })}
            </label>
            <Input
              value={form.stationId || ''}
              onChange={(e) => setF('stationId', e.target.value)}
              className="mt-1"
              placeholder={t('referrals.form.station_placeholder', { defaultValue: 'Nhập trạm gần nhất (nếu biết)' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">
                {t('referrals.form.contact_channel', { defaultValue: 'Kênh liên lạc' })}
              </label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.contactChannel || 'Zalo'}
                onChange={(e) => setF('contactChannel', e.target.value as ContactChannel)}
              >
                <option>Zalo</option>
                <option>WhatsApp</option>
                <option>Call</option>
                <option>WeChat</option>
                <option>KakaoTalk</option>
                <option>Facebook</option>
                <option>Instagram</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">
                {t('referrals.form.preferred_language', { defaultValue: 'Ngôn ngữ' })}
              </label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.preferredLanguage || 'vi'}
                onChange={(e) => setF('preferredLanguage', e.target.value as PreferredLanguage)}
              >
                <option value="vi">{t('lang.vi', { defaultValue: 'Tiếng Việt' })}</option>
                <option value="en">{t('lang.en', { defaultValue: 'English' })}</option>
                <option value="ko">{t('lang.ko', { defaultValue: '한국어' })}</option>
                <option value="ja">{t('lang.ja', { defaultValue: '日本語' })}</option>
                <option value="zh">{t('lang.zh', { defaultValue: '中文' })}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3) ĐỒNG ĐỘI & CHIA HOA HỒNG */}
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {t('referrals.form.teammate_and_share', { defaultValue: 'Đồng đội & chia hoa hồng' })}
          </h3>
          <span className="text-xs text-gray-500">
            {t('referrals.form.share_you_teammate', {
              defaultValue: 'Bạn {{self}}% • Đồng đội {{mate}}%',
              self: computedSelfPct,
              mate: teammatePct,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.teammate_optional', { defaultValue: 'Đồng đội (tùy chọn)' })}
            </label>
            <Input
              placeholder={t('referrals.form.teammate_placeholder', {
                defaultValue: 'Tên người hỗ trợ (bảo vệ, buồng phòng…)',
              })}
              value={form.teammate || ''}
              onChange={(e) => setF('teammate', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.split_commission', { defaultValue: 'Chia hoa hồng' })}
            </label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.splitPreset || '50_50'}
              onChange={(e) => setF('splitPreset', e.target.value as SplitPreset)}
            >
              <option value="50_50">{t('referrals.form.split.50_50', { defaultValue: '50% - 50%' })}</option>
              <option value="70_30">{t('referrals.form.split.70_30', { defaultValue: '70% - 30%' })}</option>
              <option value="100_0">{t('referrals.form.split.100_0', { defaultValue: '100% - 0%' })}</option>
              <option value="custom">{t('referrals.form.split.custom', { defaultValue: 'Tùy chỉnh' })}</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.your_share', {
                defaultValue: 'Tỷ lệ của bạn {{unit}}',
                unit: showCustomPct ? '(%)' : '',
              })}
            </label>
            {showCustomPct ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.splitSelfPct ?? 50}
                  onChange={(e) => setF('splitSelfPct', Number(e.target.value))}
                  className="flex-1"
                />
                <Input
                  className="w-20"
                  type="number"
                  min={0}
                  max={100}
                  value={form.splitSelfPct ?? 50}
                  onChange={(e) => setF('splitSelfPct', Number(e.target.value))}
                />
              </div>
            ) : (
              <div className="mt-1 font-medium">{computedSelfPct}%</div>
            )}
          </div>
        </div>
      </section>

      {/* 4) GHI CHÚ & TUỲ CHỌN */}
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <h3 className="mb-3 text-base font-semibold">
          {t('referrals.form.notes_and_options', { defaultValue: 'Ghi chú & tuỳ chọn' })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">
              {t('referrals.form.note', { defaultValue: 'Ghi chú' })}
            </label>
            <Textarea
              value={form.note || ''}
              onChange={(e) => setF('note', e.target.value)}
              rows={3}
              placeholder={t('referrals.form.note_placeholder', {
                defaultValue: 'Thông tin khách cần, khung giờ nhận xe, màu xe, vị trí giao nhận…',
              })}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-gray-600">
                {t('referrals.form.source_tag', { defaultValue: 'Nguồn (tag)' })}
              </label>
              <Input
                value={form.sourceTag || ''}
                onChange={(e) => setF('sourceTag', e.target.value)}
                placeholder={t('referrals.form.source_placeholder', {
                  defaultValue: 'HotelLobby / Showroom / Event / ...',
                })}
                className="mt-1"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.attributionLocked}
                onChange={(e) => setF('attributionLocked', e.target.checked)}
              />
              {t('referrals.form.lock_attribution', {
                defaultValue: 'Khóa ghi nhận hoa hồng (giữ lead cho bạn)',
              })}
            </label>
          </div>
        </div>
      </section>

      {/* ACTION */}
      <div className="pt-1 flex justify-end">
        <Button type="submit" disabled={submitting} className="h-10">
          {submitting
            ? t('saving', { defaultValue: 'Đang lưu…' })
            : t('save_quick', { defaultValue: 'Lưu nhanh' })}
        </Button>
      </div>
    </form>
  );
}
