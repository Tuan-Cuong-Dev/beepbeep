'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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

import type {
  ProgramType,
  DiscountType,
  ProgramModelDiscount,
} from '@/src/lib/programs/rental-programs/programsType';

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

/* ---------- small UI components (mobile-first) ---------- */

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
      {/* 1 cột trên mobile để tăng vùng chạm, 2 cột từ md trở lên */}
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

      {/* Xếp dọc trên mobile, ngang từ md trở lên */}
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

/* ---------- main page (mobile-first) ---------- */

export default function ProgramsFormPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, role, companyId } = useUser();

  // role helpers
  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isPrivateProvider = normalizedRole === 'private_provider';
  const isCompanyOwner = normalizedRole === 'company_owner';
  const isCompanyRole = isPrivateProvider || isCompanyOwner;

  // form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // owner + options
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // data by owner
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  // picks
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [modelDiscountsUI, setModelDiscountsUI] = useState<Record<string, ModelDiscountUI>>({});

  // meta
  const [adminProgramType, setAdminProgramType] = useState<ProgramType>('rental_program');
  const programType: ProgramType = useMemo(
    () => (isAdmin ? adminProgramType : isCompanyRole ? 'rental_program' : 'agent_program'),
    [isAdmin, adminProgramType, isCompanyRole]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  /* --------- 1) Resolve owner (company/provider) by role ---------- */
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

        // agent / unknown roles -> still allow create agent_program without owner
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

  /* --------- 2) Load stations + models by owner ---------- */
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
      // gather vehicles by companyId OR providerId
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

      // init discount UI
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
      list.push(t('programs_form_page.validation.title_required') as string);
    if (!description.trim())
      list.push(t('programs_form_page.validation.description_required') as string);
    // Admin + agent_program: có thể không cần ownerId
    if (programType === 'rental_program' && !selectedOwnerId)
      list.push(t('programs_form_page.validation.company_required') as string);
    if (!startDate || !endDate)
      list.push(t('programs_form_page.validation.dates_required') as string);
    else if (new Date(endDate) < new Date(startDate))
      list.push(t('programs_form_page.validation.date_order') as string);

    const discounts = buildModelDiscountsPayload();
    if (discounts.length === 0)
      list.push(t('programs_form_page.validation.at_least_one_discount') as string);

    return list;
  }, [title, description, selectedOwnerId, startDate, endDate, modelDiscountsUI, programType, t]);

  const canSubmit = errors.length === 0;

  /* --------- submit ---------- */

  const handleSubmit = async () => {
    if (!canSubmit) {
      setNotification({
        type: 'error',
        message: errors[0] ?? t('programs_form_page.validation.fill_required'),
      });
      return;
    }
    setSaving(true);
    try {
      const modelDiscounts = buildModelDiscountsPayload();
      await addDoc(collection(db, 'programs'), {
        title,
        description,
        type: programType,
        companyId: programType === 'rental_program' ? selectedOwnerId : null,
        stationTargets:
          isPrivateProvider || programType === 'agent_program'
            ? []
            : selectedStationIds.map((id) => ({ stationId: id })),
        modelDiscounts,
        startDate: stringToTimestamp(startDate),
        endDate: stringToTimestamp(endDate),
        createdByUserId: user?.uid ?? null,
        createdByRole: isAdmin ? 'Admin' : isPrivateProvider ? 'private_provider' : 'company_owner',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotification({ type: 'success', message: t('programs_form_page.messages.success') });
      setTimeout(() => router.push('/dashboard/programs'), 700);
    } catch (e) {
      console.error('❌ Add program failed:', e);
      setNotification({ type: 'error', message: t('programs_form_page.messages.error') });
    } finally {
      setSaving(false);
    }
  };

  /* --------- render ---------- */

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* main: mobile-first spacing */}
      <main className="flex-1 px-3 sm:px-6 pt-4 pb-[6.5rem] sm:pb-10 space-y-4 sm:space-y-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <Section>
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('programs_form_page.title')}
            </h1>
          </Section>

          {/* Owner/type selection for Admin */}
          {isAdmin && (
            <Section>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SimpleSelect
                  className="h-12"
                  options={[
                    { value: 'rental_program', label: 'Rental program' },
                    { value: 'agent_program', label: 'Agent program' },
                  ]}
                  value={adminProgramType}
                  onChange={(v) => setAdminProgramType(asProgramType(v))}
                  placeholder={t('programs_form_page.placeholders.select_program_type')}
                />
                <SimpleSelect
                  className="h-12"
                  options={companies.map((c) => ({ value: c.id, label: c.name }))}
                  value={selectedOwnerId ?? ''}
                  onChange={(val) => setSelectedOwnerId(val || null)}
                  disabled={adminProgramType === 'agent_program'}
                  placeholder={t('programs_form_page.placeholders.select_company')}
                />
              </div>
            </Section>
          )}

          <Section title={t('programs_form_page.labels.basic_info') as string}>
            <div className="space-y-3">
              <Input
                className="h-12"
                placeholder={t('programs_form_page.placeholders.title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                className="min-h-28"
                placeholder={t('programs_form_page.placeholders.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Section>

          {/* Stations (only for rental_program & non-provider) */}
          {!isPrivateProvider && programType === 'rental_program' && (
            <StationPicker
              stations={stations}
              selected={selectedStationIds}
              onToggle={toggleStation}
              disabled={loading}
              label={t('programs_form_page.labels.select_stations') as string}
            />
          )}

          {/* Models + discounts */}
          <Section title={t('programs_form_page.labels.set_discounts') as string}>
            {loading ? (
              <p className="text-sm text-gray-500">
                {t('programs_form_page.hints.loading')}
              </p>
            ) : models.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('programs_form_page.hints.no_models', { defaultValue: 'Chưa có mẫu xe cho đơn vị này.' })}
              </p>
            ) : (
              // 1 cột mobile, 2 cột >= md
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
                      labelFixed={t('programs_form_page.discount.fixed') as string}
                      labelPercent={t('programs_form_page.discount.percentage') as string}
                      warnPercentRange={t('programs_form_page.validation.percent_range') as string}
                    />
                  );
                })}
              </div>
            )}
          </Section>

          {/* Dates */}
          <Section title={t('programs_form_page.labels.time_range') as string}>
            {/* xếp dọc mobile, 2 cột từ md */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('programs_form_page.labels.start_date')}
                </label>
                <Input
                  className="h-12"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('programs_form_page.labels.end_date')}
                </label>
                <Input
                  className="h-12"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Errors */}
          {(error || errors.length > 0) && (
            <Section>
              <div className="text-sm text-red-600">
                {error || errors[0]}
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Sticky action bar (mobile-first) */}
      <div className="sticky bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="max-w-2xl mx-auto px-3 py-3 sm:px-6 sm:py-4">
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="h-12 w-full rounded-xl"
          >
            {saving ? t('programs_form_page.buttons.saving') : t('programs_form_page.buttons.submit')}
          </Button>
          {/* safe area cho iOS */}
          <div className="h-[max(env(safe-area-inset-bottom),0px)]" />
        </div>
      </div>

      <Footer />

      {notification && (
        <NotificationDialog
          open
          type={notification.type}
          title={t(`programs_form_page.notification.${notification.type}`)}
          description={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
