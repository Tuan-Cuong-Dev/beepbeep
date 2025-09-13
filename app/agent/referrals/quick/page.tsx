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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common', { useSuspense: false });
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
      setNotif({ open: true, ok: false, msg: t('hotel_quick_referral_page.notif.invalid_input') });
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
        msg: id
          ? t('hotel_quick_referral_page.notif.saved_ok')
          : t('hotel_quick_referral_page.notif.save_fail'),
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
      setNotif({ open: true, ok: false, msg: t('hotel_quick_referral_page.notif.error_retry') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-4 sm:p-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">
            {t('hotel_quick_referral_page.title')}
          </h1>

          {/* Basic */}
          <div className="space-y-3">
            <FieldRow label={t('hotel_quick_referral_page.fields.full_name_label')} required>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('hotel_quick_referral_page.placeholders.full_name_ph')}
                className="h-10"
              />
            </FieldRow>

            <FieldRow label={t('hotel_quick_referral_page.fields.phone_label')} required>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder={t('hotel_quick_referral_page.placeholders.phone_ph')}
                className="h-10"
              />
            </FieldRow>

            <FieldRow label={t('hotel_quick_referral_page.fields.expected_start_label')}>
              <DatePicker
                selected={expectedStart ?? null}
                onChange={(d) => setExpectedStart(d)}
                className="w-full rounded border px-3 py-2 h-10"
                placeholderText={t('hotel_quick_referral_page.placeholders.date_ph')}
              />
            </FieldRow>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label={t('hotel_quick_referral_page.fields.days_label')}>
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

              <FieldRow label={t('hotel_quick_referral_page.fields.quantity_label')}>
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

            <FieldRow label={t('hotel_quick_referral_page.fields.vehicle_type_default_label')}>
              <select
                className="w-full rounded border px-3 py-2 h-10"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)}
              >
                <option value="motorbike">{t('hotel_quick_referral_page.vehicle_type_options.motorbike')}</option>
                <option value="bike">{t('hotel_quick_referral_page.vehicle_type_options.bike')}</option>
                <option value="car">{t('hotel_quick_referral_page.vehicle_type_options.car')}</option>
                <option value="van">{t('hotel_quick_referral_page.vehicle_type_options.van')}</option>
                <option value="bus">{t('hotel_quick_referral_page.vehicle_type_options.bus')}</option>
                <option value="other">{t('hotel_quick_referral_page.vehicle_type_options.other')}</option>
              </select>
            </FieldRow>

            <FieldRow label={t('hotel_quick_referral_page.fields.note_label')}>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('hotel_quick_referral_page.placeholders.note_ph')}
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
              {t('hotel_quick_referral_page.teammate.has_mate_label')}
            </label>

            {hasMate && (
              <div className="mt-3 space-y-3">
                <FieldRow label={t('hotel_quick_referral_page.teammate.mate_name_label')} required>
                  <Input
                    value={mateName}
                    onChange={(e) => setMateName(e.target.value)}
                    placeholder={t('hotel_quick_referral_page.placeholders.mate_name_ph')}
                    className="h-10"
                  />
                </FieldRow>

                <FieldRow label={t('hotel_quick_referral_page.teammate.mate_phone_label')}>
                  <Input
                    value={matePhone}
                    onChange={(e) => setMatePhone(e.target.value)}
                    inputMode="tel"
                    placeholder={t('hotel_quick_referral_page.placeholders.mate_phone_ph')}
                    className="h-10"
                  />
                </FieldRow>

                <FieldRow label={t('hotel_quick_referral_page.teammate.split_ratio_label')}>
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
                      <option value="50_50">{t('hotel_quick_referral_page.teammate.split_presets.50_50')}</option>
                      <option value="70_30">{t('hotel_quick_referral_page.teammate.split_presets.70_30')}</option>
                      <option value="100_0">{t('hotel_quick_referral_page.teammate.split_presets.100_0')}</option>
                      <option value="custom">{t('hotel_quick_referral_page.teammate.split_presets.custom')}</option>
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
                    <span className="text-sm text-gray-600">
                      {t('hotel_quick_referral_page.teammate.percent_hint')}
                    </span>
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
              {submitting
                ? t('hotel_quick_referral_page.buttons.saving')
                : t('hotel_quick_referral_page.buttons.submit')}
            </Button>
          </div>
        </div>
      </main>
      <Footer />

      <NotificationDialog
        open={notif.open}
        onClose={() => setNotif((p) => ({ ...p, open: false }))}
        type={notif.ok ? 'success' : 'error'}
        title={
          notif.ok
            ? t('hotel_quick_referral_page.notif.success_title')
            : t('hotel_quick_referral_page.notif.error_title')
        }
        description={notif.msg}
      />
    </div>
  );
}
