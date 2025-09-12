'use client';

import { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { useUser } from '@/src/context/AuthContext';
import { useAgentReferrals } from '@/src/hooks/useAgentReferrals';

/* ---------- helpers ---------- */
const toFsTime = (d?: Date | null) => (d ? Timestamp.fromDate(d) : null);

const vnPhoneNormalize = (s: string) => {
  const d = s.replace(/[^\d]/g, '');
  if (d.startsWith('0')) return d;
  if (d.startsWith('84')) return '0' + d.slice(2);
  return d;
};

/** Field responsive:
 * - Mobile: label trên, input dưới (full width)
 * - Desktop (md+): 2 cột label | control như cũ
 */
function FieldRow({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-[160px_1fr] md:items-center md:gap-x-2">
      <label className="text-sm text-gray-600 md:text-right">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ---------- page ---------- */
export default function HotelQuickReferralPage() {
  const { user } = useUser();
  const agentId = user?.uid;
  const { create } = useAgentReferrals(agentId);

  // Core fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [expectedStart, setExpectedStart] = useState<Date | null>(new Date());
  const [days, setDays] = useState<number>(1);
  const [vehicleType, setVehicleType] =
    useState<'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other'>('motorbike');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');

  // Teammate (optional)
  const [hasMate, setHasMate] = useState(false);
  const [mateName, setMateName] = useState('');
  const [matePhone, setMatePhone] = useState('');
  const [splitPreset, setSplitPreset] =
    useState<'50_50' | '70_30' | '100_0' | 'custom'>('50_50');
  const [splitSelfPct, setSplitSelfPct] = useState(50);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  const canSubmit = useMemo(() => {
    return fullName.trim().length > 0 && phone.replace(/[^\d]/g, '').length >= 9;
  }, [fullName, phone]);

  const onSubmit = async () => {
    if (!canSubmit) {
      setNotif({ open: true, ok: false, msg: 'Vui lòng nhập Họ tên & SĐT hợp lệ.' });
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        fullName: fullName.trim(),
        phone: vnPhoneNormalize(phone),
        note: note.trim() || '',
        expectedStart: toFsTime(expectedStart),
        vehicleType,
        quantity,
        consentContact: true,
        source: 'agent_form',
        sourceTag: 'HotelQuick',
        meta: { days, qty: quantity },
      };

      if (hasMate && mateName.trim()) {
        payload.teammate = {
          name: mateName.trim(),
          phone: matePhone.trim() || undefined,
        };
        payload.splitPreset = splitPreset;
        payload.splitSelfPct =
          splitPreset === 'custom'
            ? Math.min(100, Math.max(0, splitSelfPct || 0))
            : splitPreset === '70_30'
            ? 70
            : splitPreset === '100_0'
            ? 100
            : 50; // 50_50
      }

      const id = await create(payload);
      setNotif({
        open: true,
        ok: !!id,
        msg: id ? 'Đã lưu giới thiệu nhanh. Bạn có thể đặt xe cho khách sau.' : 'Không thể lưu giới thiệu.',
      });

      if (id) {
        // reset nhẹ, giữ ngày & vehicleType cho ca làm
        setFullName('');
        setPhone('');
        setQuantity(1);
        setNote('');
        setHasMate(false);
        setMateName('');
        setMatePhone('');
        setSplitPreset('50_50');
        setSplitSelfPct(50);
      }
    } catch (e) {
      console.error(e);
      setNotif({ open: true, ok: false, msg: 'Lưu thất bại. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Giới thiệu khách (Nhanh)</h1>

          {/* Basic */}
          <div className="space-y-3">
            <FieldRow label="Họ tên" required>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="h-10"
              />
            </FieldRow>

            <FieldRow label="Số điện thoại" required>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="0xxxxxxxxx"
                className="h-10"
              />
            </FieldRow>

            <FieldRow label="Ngày dự kiến thuê">
              <DatePicker
                selected={expectedStart ?? null}
                onChange={(d) => setExpectedStart(d)}
                className="w-full rounded border px-3 py-2 h-10"
                placeholderText="Chọn ngày"
              />
            </FieldRow>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Số ngày">
                <select
                  className="w-full rounded border px-3 py-2 h-10"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Số lượng xe">
                <Input
                  type="number"
                  className="h-10"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
              </FieldRow>
            </div>

            <FieldRow label="Loại xe (mặc định)">
              <select
                className="w-full rounded border px-3 py-2 h-10"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)}
              >
                <option value="motorbike">Xe máy</option>
                <option value="bike">Xe đạp</option>
                <option value="car">Ô tô</option>
                <option value="van">Xe van</option>
                <option value="bus">Xe buýt</option>
                <option value="other">Khác</option>
              </select>
            </FieldRow>

            <FieldRow label="Ghi chú">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Yêu cầu đặc biệt của khách…"
              />
            </FieldRow>
          </div>

          {/* Teammate */}
          <div className="mt-4 pt-3 border-t">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasMate}
                onChange={(e) => setHasMate(e.target.checked)}
              />
              Có đồng đội cùng giới thiệu?
            </label>

            {hasMate && (
              <div className="mt-3 space-y-3">
                <FieldRow label="Tên đồng đội" required>
                  <Input
                    value={mateName}
                    onChange={(e) => setMateName(e.target.value)}
                    placeholder="Anh Tuấn bảo vệ"
                    className="h-10"
                  />
                </FieldRow>

                <FieldRow label="SĐT đồng đội">
                  <Input
                    value={matePhone}
                    onChange={(e) => setMatePhone(e.target.value)}
                    inputMode="tel"
                    placeholder="0xxxxxxxxx (tuỳ chọn)"
                    className="h-10"
                  />
                </FieldRow>

                <FieldRow label="Tỷ lệ chia">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                      className="rounded border px-3 py-2 h-10"
                      value={splitPreset}
                      onChange={(e) => {
                        const v = e.target.value as typeof splitPreset;
                        setSplitPreset(v);
                        if (v === '50_50') setSplitSelfPct(50);
                        if (v === '70_30') setSplitSelfPct(70);
                        if (v === '100_0') setSplitSelfPct(100);
                      }}
                    >
                      <option value="50_50">50% tôi • 50% đồng đội</option>
                      <option value="70_30">70% tôi • 30% đồng đội</option>
                      <option value="100_0">100% tôi</option>
                      <option value="custom">Tuỳ chỉnh</option>
                    </select>

                    {splitPreset === 'custom' && (
                      <Input
                        type="number"
                        className="w-28 h-10"
                        min={0}
                        max={100}
                        value={splitSelfPct}
                        onChange={(e) =>
                          setSplitSelfPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                        }
                      />
                    )}
                    <span className="text-sm text-gray-600">(phần trăm của bạn)</span>
                  </div>
                </FieldRow>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="mt-5">
            <Button
              className="w-full h-12 rounded-xl"
              onClick={onSubmit}
              disabled={submitting || !canSubmit}
            >
              {submitting ? 'Đang lưu…' : 'Tạo giới thiệu'}
            </Button>
          </div>
        </div>
      </main>
      <Footer />

      <NotificationDialog
        open={notif.open}
        onClose={() => setNotif((p) => ({ ...p, open: false }))}
        type={notif.ok ? 'success' : 'error'}
        title={notif.ok ? 'Thành công' : 'Lỗi'}
        description={notif.msg}
      />
    </div>
  );
}
