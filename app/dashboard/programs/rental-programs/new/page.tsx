'use client';

import { useEffect, useMemo, useState, useCallback, forwardRef } from 'react';
import {
  addDoc, collection, serverTimestamp, getDocs, query, where, documentId,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { stringToTimestamp } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

import type {
  ProgramType,
  DiscountType,
  ProgramModelDiscount,
} from '@/src/lib/programs/rental-programs/programsType';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/* ---------- helpers ---------- */
type Company = { id: string; name: string };
type Station = { id: string; name: string };
type Model = { id: string; name: string };
type ModelDiscountUI = { type: DiscountType; value: string };

const chunk = <T,>(arr: T[], size = 10) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const asProgramType = (val: string): ProgramType =>
  val === 'agent_program' ? 'agent_program' : 'rental_program';

/** parse yyyy-MM-dd -> Date|null */
const parseYMD = (s: string): Date | null => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) ? dt : null;
};
/** format Date -> yyyy-MM-dd */
const fmtYMD = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';

/* ---------- small UI components ---------- */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
      {title && <h3 className="text-base font-semibold mb-3 sm:mb-4">{title}</h3>}
      {children}
    </section>
  );
}

function StationPicker({
  stations,
  selected,
  onToggle,
  disabled,
  label,
}: {
  stations: Station[];
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
  label: string;
}) {
  if (stations.length === 0) return null;
  return (
    <Section title={label}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {stations.map((st) => {
          const active = selected.includes(st.id);
          return (
            <Button
              key={st.id}
              variant={active ? 'default' : 'outline'}
              onClick={() => onToggle(st.id)}
              disabled={disabled}
              className="h-12 justify-center"
            >
              {st.name}
            </Button>
          );
        })}
      </div>
    </Section>
  );
}

function ModelDiscountRow({
  model,
  ui,
  onChangeType,
  onChangeValue,
  labelFixed,
  labelPercent,
  warnPercentRange,
}: {
  model: Model;
  ui: ModelDiscountUI;
  onChangeType: (t: DiscountType) => void;
  onChangeValue: (v: string) => void;
  labelFixed: string;
  labelPercent: string;
  warnPercentRange: string;
}) {
  return (
    <div className="flex flex-col gap-3 border rounded-xl p-4">
      <div className="text-sm font-medium">{model.name}</div>
      <div className="flex flex-col md:flex-row gap-3">
        <SimpleSelect
          className="w-full md:w-40"
          options={[
            { value: 'fixed', label: labelFixed },
            { value: 'percentage', label: labelPercent },
          ]}
          value={ui.type}
          onChange={(val) => onChangeType(val as DiscountType)}
        />
        <Input
          className="h-12"
          placeholder={ui.type === 'fixed' ? labelFixed : labelPercent}
          inputMode={ui.type === 'fixed' ? 'numeric' : 'decimal'}
          value={ui.value}
          onChange={(e) => {
            const raw = e.target.value;
            const next =
              ui.type === 'fixed'
                ? formatCurrency(parseCurrencyString(raw))
                : raw.replace(/[^\d.]/g, '').slice(0, 6);
            onChangeValue(next);
          }}
        />
      </div>
      {ui.type === 'percentage' && ui.value && Number(ui.value) > 100 && (
        <div className="text-xs text-red-600">{warnPercentRange}</div>
      )}
    </div>
  );
}

/* ---------- Reusable DateField ---------- */
type DateFieldProps = {
  id: string;
  label: string;
  value: string;              // yyyy-MM-dd
  onChange: (val: string) => void;
  min?: string;               // yyyy-MM-dd
  max?: string;               // yyyy-MM-dd
  placeholder?: string;
};

function DateField({ id, label, value, onChange, min, max, placeholder = 'YYYY-MM-DD' }: DateFieldProps) {
  const CalendarButton = forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
    ({ onClick }, ref) => (
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        className="h-10 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50"
        aria-label={`Open ${label} calendar`}
      >
        📅
      </button>
    )
  );
  CalendarButton.displayName = 'CalendarButton';

  const selected = parseYMD(value);
  const minDate = min ? parseYMD(min) ?? undefined : undefined;
  const maxDate = max ? parseYMD(max) ?? undefined : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d-]/g, '').slice(0, 10);
            onChange(raw);
          }}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={label}
        />
        <DatePicker
          selected={selected}
          onChange={(d) => onChange(fmtYMD(d as Date))}
          minDate={minDate}
          maxDate={maxDate}
          customInput={<CalendarButton />}
          withPortal
        />
      </div>

      <p className="mt-1 text-xs text-gray-500">
        {safeFormatDate(value, 'dd/MM/yyyy')}
      </p>
    </div>
  );
}

/* ---------- main page ---------- */
export default function ProgramsFormPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, role, companyId } = useUser();

  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isPrivateProvider = normalizedRole === 'private_provider';
  const isCompanyOwner = normalizedRole === 'company_owner';
  const isCompanyRole = isPrivateProvider || isCompanyOwner;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // yyyy-MM-dd để đồng bộ stringToTimestamp
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [modelDiscountsUI, setModelDiscountsUI] = useState<Record<string, ModelDiscountUI>>({});

  // NEW: cho phép company role chọn loại chương trình
  const [adminProgramType, setAdminProgramType] = useState<ProgramType>('rental_program');
  const [companyProgramType, setCompanyProgramType] = useState<ProgramType>('rental_program');

  const programType: ProgramType = useMemo(
    () => (isAdmin ? adminProgramType : isCompanyRole ? companyProgramType : 'agent_program'),
    [isAdmin, adminProgramType, isCompanyRole, companyProgramType]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  /* --------- 1) Resolve owner ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (isAdmin) {
          const snap = await getDocs(collection(db, 'rentalCompanies'));
          if (!mounted) return;
          const list: Company[] = snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name }));
          setCompanies(list);
          if (!selectedOwnerId && list.length) setSelectedOwnerId(list[0].id);
          return;
        }
        if (isPrivateProvider) {
          if (!user?.uid) return;
          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          if (!mounted) return;
          setSelectedOwnerId(snap.docs[0]?.id ?? null);
          return;
        }
        if (isCompanyOwner) {
          if (!mounted) return;
          setSelectedOwnerId(companyId ?? null);
          return;
        }
        setSelectedOwnerId(null);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to resolve owner');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin, isPrivateProvider, isCompanyOwner, companyId, user?.uid, selectedOwnerId]);

  /* --------- 2) Load stations + models ---------- */
  useEffect(() => {
    let mounted = true;
    const loadStations = async (ownerId: string) => {
      if (isPrivateProvider) {
        setStations([]);
        return;
      }
      const snap = await getDocs(
        query(collection(db, 'rentalStations'), where('companyId', '==', ownerId))
      );
      if (!mounted) return;
      setStations(snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name })));
    };
    const loadModels = async (ownerId: string) => {
      const [v1, v2] = await Promise.all([
        getDocs(query(collection(db, 'vehicles'), where('companyId', '==', ownerId))),
        getDocs(query(collection(db, 'vehicles'), where('providerId', '==', ownerId))),
      ]);
      const modelIds = Array.from(
        new Set(
          [...v1.docs, ...v2.docs]
            .map((d) => (d.data() as any).modelId)
            .filter(Boolean)
        )
      ) as string[];
      if (modelIds.length === 0) {
        if (mounted) setModels([]);
        return;
      }
      const map = new Map<string, Model>();
      for (const group of chunk(modelIds, 10)) {
        const msnap = await getDocs(
          query(collection(db, 'vehicleModels'), where(documentId(), 'in', group))
        );
        msnap.forEach((d) => {
          const data = d.data() as any;
          map.set(d.id, { id: d.id, name: (data?.name ?? '').toString() });
        });
      }
      if (!mounted) return;
      const sorted = Array.from(map.values()).sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'vi', { sensitivity: 'base' })
      );
      setModels(sorted);
      setModelDiscountsUI((prev) => {
        const copy = { ...prev };
        sorted.forEach((m) => {
          if (!copy[m.id]) copy[m.id] = { type: 'fixed', value: '' };
        });
        return copy;
      });
    };
    (async () => {
      if (!selectedOwnerId) {
        setStations([]);
        setModels([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        await Promise.all([loadStations(selectedOwnerId), loadModels(selectedOwnerId)]);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load stations/models');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedOwnerId, isPrivateProvider]);

  /* --------- handlers ---------- */
  const toggleStation = useCallback((id: string) => {
    setSelectedStationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const buildModelDiscountsPayload = (): ProgramModelDiscount[] => {
    const items: ProgramModelDiscount[] = [];
    for (const [modelId, ui] of Object.entries(modelDiscountsUI)) {
      const raw = (ui.value || '').trim();
      if (!raw) continue;
      const val =
        ui.type === 'fixed'
          ? parseCurrencyString(raw)
          : Number(raw.replace('%', '').trim());
      if (Number.isNaN(val)) continue;
      if (ui.type === 'percentage' && (val < 0 || val > 100)) continue;
      if (ui.type === 'fixed' && val < 0) continue;
      items.push({ modelId, discountType: ui.type, discountValue: val });
    }
    return items;
  };

  /* --------- validation ---------- */
  const errors = useMemo(() => {
    const list: string[] = [];
    if (!title.trim())
      list.push(t('programs_form_page.validation.title_required', { defaultValue: 'Vui lòng nhập tiêu đề.' }) as string);
    if (!description.trim())
      list.push(t('programs_form_page.validation.description_required', { defaultValue: 'Vui lòng nhập mô tả.' }) as string);

    if (programType === 'rental_program' && !selectedOwnerId)
      list.push(t('programs_form_page.validation.company_required', { defaultValue: 'Vui lòng chọn đơn vị áp dụng.' }) as string);

    if (!startDate || !endDate)
      list.push(t('programs_form_page.validation.dates_required', { defaultValue: 'Vui lòng chọn thời gian áp dụng.' }) as string);
    else {
      const s = parseYMD(startDate);
      const e = parseYMD(endDate);
      if (!s || !e) {
        list.push(t('programs_form_page.validation.dates_required', { defaultValue: 'Vui lòng chọn thời gian áp dụng.' }) as string);
      } else if (e.getTime() < s.getTime()) {
        list.push(t('programs_form_page.validation.date_order', { defaultValue: 'Ngày kết thúc phải sau ngày bắt đầu.' }) as string);
      }
    }

    // 🔴 Quan trọng: chỉ rental_program mới yêu cầu discount
    if (programType === 'rental_program') {
      const discounts = buildModelDiscountsPayload();
      if (discounts.length === 0)
        list.push(t('programs_form_page.validation.at_least_one_discount', { defaultValue: 'Cần ít nhất 1 cấu hình giảm giá.' }) as string);
    }

    return list;
  }, [title, description, selectedOwnerId, startDate, endDate, modelDiscountsUI, programType, t]);

  const canSubmit = errors.length === 0;

  /* --------- submit ---------- */
  const handleSubmit = async () => {
    if (!canSubmit) {
      setNotification({
        type: 'error',
        message: errors[0] ?? (t('programs_form_page.validation.fill_required', { defaultValue: 'Vui lòng điền đầy đủ thông tin bắt buộc.' }) as string),
      });
      return;
    }
    setSaving(true);
    try {
      const modelDiscounts = programType === 'rental_program' ? buildModelDiscountsPayload() : [];

      await addDoc(collection(db, 'programs'), {
        title,
        description,
        type: programType,
        companyId: programType === 'rental_program' ? selectedOwnerId : null,
        // Stations & discounts CHỈ áp dụng cho rental_program
        stationTargets:
          programType === 'rental_program' && !isPrivateProvider
            ? selectedStationIds.map((id) => ({ stationId: id }))
            : [],
        modelDiscounts,
        startDate: stringToTimestamp(startDate),
        endDate: stringToTimestamp(endDate),
        createdByUserId: user?.uid ?? null,
        createdByRole: isAdmin ? 'Admin' : isPrivateProvider ? 'private_provider' : 'company_owner',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotification({ type: 'success', message: t('programs_form_page.messages.success', { defaultValue: 'Tạo chương trình thành công.' }) });
      setTimeout(() => router.push('/dashboard/programs'), 700);
    } catch (e) {
      console.error('❌ Add program failed:', e);
      setNotification({ type: 'error', message: t('programs_form_page.messages.error', { defaultValue: 'Tạo chương trình thất bại.' }) });
    } finally {
      setSaving(false);
    }
  };

  /* --------- render ---------- */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-3 sm:px-6 pt-4 pb-[6.5rem] sm:pb-10 space-y-4 sm:space-y-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Section>
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('programs_form_page.title', { defaultValue: 'Tạo chương trình' })}
            </h1>
          </Section>

          {/* Program type selector + explain */}
          {(isAdmin || isCompanyRole) && (
            <Section>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SimpleSelect
                  className="h-12"
                  options={[
                    { value: 'rental_program', label: t('programs_form_page.labels.rental_program', { defaultValue: 'Rental program' }) as string },
                    { value: 'agent_program', label: t('programs_form_page.labels.agent_program', { defaultValue: 'Agent program' }) as string },
                  ]}
                  value={isAdmin ? adminProgramType : companyProgramType}
                  onChange={(v) => (isAdmin ? setAdminProgramType(asProgramType(v)) : setCompanyProgramType(asProgramType(v)))}
                  placeholder={t('programs_form_page.placeholders.select_program_type', { defaultValue: 'Chọn loại chương trình' })}
                />

                {isAdmin && (
                  <SimpleSelect
                    className="h-12"
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    value={selectedOwnerId ?? ''}
                    onChange={(val) => setSelectedOwnerId(val || null)}
                    disabled={(isAdmin ? adminProgramType : companyProgramType) === 'agent_program'}
                    placeholder={t('programs_form_page.placeholders.select_company', { defaultValue: 'Chọn công ty áp dụng' })}
                  />
                )}
              </div>

              {/* Subtitle giải thích từng loại — NHẤN MẠNH LOGIC CTV */}
              <div className="mt-3 grid grid-cols-1 gap-3">
                {programType === 'rental_program' ? (
                  <div className="rounded-lg border bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {t('programs_form_page.explain.rental', {
                      defaultValue:
                        'Rental program: áp dụng giảm giá theo mẫu xe / trạm / thời gian cho khách thuê. CTV sẽ nhận hoa hồng dựa trên CHÍNH phần giảm giá này khi phát sinh booking.',
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    {t('programs_form_page.explain.agent', {
                      defaultValue:
                        'Agent program: chương trình để CTV/đại lý tham gia & theo dõi. KHÔNG cấu hình giảm giá ở đây; hoa hồng CTV được tính theo mức giảm giá của các rental program áp vào booking.',
                    })}
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section title={t('programs_form_page.labels.basic_info', { defaultValue: 'Thông tin cơ bản' }) as string}>
            <div className="space-y-3">
              <Input
                className="h-12"
                placeholder={t('programs_form_page.placeholders.title', { defaultValue: 'Tiêu đề chương trình' })}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Textarea
                className="min-h-28"
                placeholder={t('programs_form_page.placeholders.description', { defaultValue: 'Mô tả ngắn về chương trình' })}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Section>

          {/* Stations: chỉ rental_program & không phải private provider */}
          {!isPrivateProvider && programType === 'rental_program' && (
            <StationPicker
              stations={stations}
              selected={selectedStationIds}
              onToggle={toggleStation}
              disabled={loading}
              label={t('programs_form_page.labels.select_stations', { defaultValue: 'Chọn trạm áp dụng (tuỳ chọn)' }) as string}
            />
          )}

          {/* Discounts: chỉ rental_program — vì CTV ăn theo discount này */}
          {programType === 'rental_program' && (
            <Section title={t('programs_form_page.labels.set_discounts', { defaultValue: 'Thiết lập giảm giá theo mẫu xe' }) as string}>
              {loading ? (
                <p className="text-sm text-gray-500">
                  {t('programs_form_page.hints.loading', { defaultValue: 'Đang tải dữ liệu…' })}
                </p>
              ) : models.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t('programs_form_page.hints.no_models', { defaultValue: 'Chưa có mẫu xe cho đơn vị này.' })}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {models.map((m) => {
                    const ui = modelDiscountsUI[m.id] || { type: 'fixed', value: '' };
                    return (
                      <ModelDiscountRow
                        key={m.id}
                        model={m}
                        ui={ui}
                        onChangeType={(type) =>
                          setModelDiscountsUI((prev) => ({ ...prev, [m.id]: { ...ui, type } }))
                        }
                        onChangeValue={(value) =>
                          setModelDiscountsUI((prev) => ({ ...prev, [m.id]: { ...ui, value } }))
                        }
                        labelFixed={t('programs_form_page.discount.fixed', { defaultValue: 'Giảm cố định (VND/ngày)' }) as string}
                        labelPercent={t('programs_form_page.discount.percentage', { defaultValue: 'Giảm theo %' }) as string}
                        warnPercentRange={t('programs_form_page.validation.percent_range', { defaultValue: 'Phần trăm phải từ 0 đến 100.' }) as string}
                      />
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {/* Time range */}
          <Section title={t('programs_form_page.labels.time_range', { defaultValue: 'Thời gian áp dụng' }) as string}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateField
                id="start-date"
                label={t('programs_form_page.labels.start_date', { defaultValue: 'Ngày bắt đầu' }) as string}
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  const s = parseYMD(v);
                  const e = parseYMD(endDate);
                  if (s && e && e.getTime() < s.getTime()) {
                    setEndDate('');
                  }
                }}
              />
              <DateField
                id="end-date"
                label={t('programs_form_page.labels.end_date', { defaultValue: 'Ngày kết thúc' }) as string}
                value={endDate}
                onChange={setEndDate}
                min={startDate || undefined}
              />
            </div>
          </Section>

          {(error || errors.length > 0) && (
            <Section>
              <div className="text-sm text-red-600">
                {error || errors[0]}
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="max-w-2xl mx-auto px-3 py-3 sm:px-6 sm:py-4">
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="h-12 w-full rounded-xl"
          >
            {saving ? t('programs_form_page.buttons.saving', { defaultValue: 'Đang lưu…' }) : t('programs_form_page.buttons.submit', { defaultValue: 'Tạo chương trình' })}
          </Button>
          <div className="h-[max(env(safe-area-inset-bottom),0px)]" />
        </div>
      </div>

      <Footer />

      {notification && (
        <NotificationDialog
          open
          type={notification.type}
          title={t(`programs_form_page.notification.${notification.type}`, { defaultValue: notification.type === 'success' ? 'Thành công' : 'Lỗi' })}
          description={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
