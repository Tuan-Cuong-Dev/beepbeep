'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, serverTimestamp, getDocs, query, where, documentId
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { SimpleSelect } from '@/src/components/ui/select';
import { stringToTimestamp } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { ProgramType } from '@/src/lib/programs/programsType';
import { useTranslation } from 'react-i18next';

type Company = { id: string; name: string };
type Station = { id: string; name: string };
type Model = { id: string; name: string };

const chunk = <T,>(arr: T[], size = 10) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function ProgramsFormPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, role, companyId } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [selectedModelDiscounts, setSelectedModelDiscounts] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isPrivateProvider = normalizedRole === 'private_provider';
  const isCompanyOwner = normalizedRole === 'company_owner';
  const isCompanyRole = isPrivateProvider || isCompanyOwner;

  // 1) Xác định ownerId: admin chọn công ty; company_owner dùng companyId; private_provider -> providerId theo ownerId
  useEffect(() => {
    let mounted = true;
    (async () => {
      setListLoading(true);
      try {
        if (isAdmin) {
          const snap = await getDocs(collection(db, 'rentalCompanies'));
          const list: Company[] = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name }));
          if (!mounted) return;
          setCompanies(list);
          if (!selectedCompanyId && list.length) setSelectedCompanyId(list[0].id);
        } else if (isPrivateProvider) {
          if (!user?.uid) return;
          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          if (!mounted) return;
          // dùng providerId làm "ownerId" cho toàn bộ truy vấn tiếp theo
          setSelectedCompanyId(snap.docs[0]?.id ?? null);
        } else if (isCompanyOwner) {
          if (!mounted) return;
          setSelectedCompanyId(companyId ?? null);
        } else {
          if (!mounted) return;
          setSelectedCompanyId(null);
        }
      } finally {
        if (mounted) setListLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAdmin, isPrivateProvider, isCompanyOwner, companyId, user?.uid]); // eslint-disable-line

  // 2) Load STATIONS (bỏ cho private_provider) + MODELS
  useEffect(() => {
    let mounted = true;

    const loadStations = async (ownerId: string) => {
      // private_provider không có trạm
      if (isPrivateProvider) {
        setStations([]);
        return;
      }
      const stSnap = await getDocs(
        query(collection(db, 'rentalStations'), where('companyId', '==', ownerId))
      );
      if (!mounted) return;
      setStations(stSnap.docs.map(d => ({ id: d.id, name: (d.data() as any).name })));
    };

    const loadModelsFromVehicles = async (ownerId: string) => {
      // 2.1 lấy tất cả vehicles thuộc ownerId (hỗ trợ cả companyId / providerId để tương thích dữ liệu)
      const [v1, v2] = await Promise.all([
        getDocs(query(collection(db, 'vehicles'), where('companyId', '==', ownerId))),
        getDocs(query(collection(db, 'vehicles'), where('providerId', '==', ownerId))),
      ]);

      const byId = new Map<string, any>();
      v1.docs.forEach(d => byId.set(d.id, { id: d.id, ...(d.data() as any) }));
      v2.docs.forEach(d => byId.set(d.id, { id: d.id, ...(d.data() as any) }));

      const modelIds = Array.from(
        new Set(
          Array.from(byId.values())
            .map(v => (v as any).modelId)
            .filter(Boolean)
        )
      ) as string[];

      if (modelIds.length === 0) {
        if (mounted) setModels([]);
        return;
      }

      // 2.2 fetch vehicleModels theo danh sách modelIds (chunk 10 id/lần)
      const modelMap = new Map<string, Model>();
      for (const group of chunk(modelIds, 10)) {
        const msnap = await getDocs(
          query(collection(db, 'vehicleModels'), where(documentId(), 'in', group))
        );
        msnap.forEach(d =>
          modelMap.set(d.id, { id: d.id, name: (d.data() as any).name })
        );
      }
      if (!mounted) return;
      setModels(Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })));
    };

    (async () => {
      if (!selectedCompanyId) {
        setStations([]); setModels([]); return;
      }
      setDetailLoading(true);
      try {
        await Promise.all([
          loadStations(selectedCompanyId),
          loadModelsFromVehicles(selectedCompanyId),
        ]);
      } catch (e) {
        console.error('❌ Error loading stations/models:', e);
        if (mounted) { setStations([]); setModels([]); }
      } finally {
        if (mounted) setDetailLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [selectedCompanyId, isPrivateProvider]);

  const toggleStation = useCallback((stationId: string) => {
    setSelectedStationIds(prev =>
      prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
    );
  }, []);

  const programType: ProgramType = useMemo(
    () => (isCompanyRole ? 'rental_program' : 'agent_program'),
    [isCompanyRole]
  );

  const canSubmit = useMemo(() => {
    return Boolean(
      title &&
      description &&
      selectedCompanyId &&
      Object.keys(selectedModelDiscounts).length > 0 &&
      startDate &&
      endDate
    );
  }, [title, description, selectedCompanyId, selectedModelDiscounts, startDate, endDate]);

  // 3) Submit
  const handleSubmit = async () => {
    if (!canSubmit) {
      setNotification({ type: 'error', message: t('programs_form_page.validation.fill_required') });
      return;
    }
    setIsSubmitting(true);
    try {
      const parsed: Record<string, number> = {};
      for (const [id, val] of Object.entries(selectedModelDiscounts)) {
        parsed[id] = parseCurrencyString(val);
      }
      await addDoc(collection(db, 'programs'), {
        title,
        description,
        type: programType,
        companyId: selectedCompanyId,        // với private_provider: dùng providerId để tương thích
        stationIds: selectedStationIds,      // sẽ rỗng nếu là private_provider
        modelDiscounts: parsed,
        startDate: stringToTimestamp(startDate),
        endDate: stringToTimestamp(endDate),
        createdByUserId: user?.uid ?? null,
        createdByRole: normalizedRole,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotification({ type: 'success', message: t('programs_form_page.messages.success') });
      setTimeout(() => router.push('/dashboard/programs'), 800);
    } catch (err) {
      console.error('❌ Add program failed:', err);
      setNotification({ type: 'error', message: t('programs_form_page.messages.error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 space-y-8 pb-24">
        <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold">{t('programs_form_page.title')}</h1>

          {/* Admin chọn company; provider/company_owner auto-filled */}
          {isAdmin && (
            <SimpleSelect
              options={companies.map(c => ({ value: c.id, label: c.name }))}
              placeholder={t('programs_form_page.placeholders.select_company')}
              value={selectedCompanyId ?? ''}
              onChange={(val) => setSelectedCompanyId(val)}
              disabled={listLoading}
            />
          )}

          <Input
            placeholder={t('programs_form_page.placeholders.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            className="h-32"
            placeholder={t('programs_form_page.placeholders.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Stations — ẨN cho private_provider */}
          {!isPrivateProvider && stations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t('programs_form_page.labels.select_stations')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {stations.map(st => (
                  <Button
                    key={st.id}
                    variant={selectedStationIds.includes(st.id) ? 'default' : 'outline'}
                    onClick={() => toggleStation(st.id)}
                    disabled={detailLoading}
                  >
                    {st.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Models (lấy từ vehicles -> vehicleModels) */}
          <div>
            <h3 className="font-semibold mb-2">{t('programs_form_page.labels.set_discounts')}</h3>
            {models.length === 0 ? (
              <p className="text-sm text-gray-500">
                {detailLoading
                  ? t('programs_form_page.hints.loading', { defaultValue: 'Đang tải…' })
                  : t('programs_form_page.hints.no_models', { defaultValue: 'Chưa có mẫu xe cho đơn vị này.' })}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {models.map(m => (
                  <div key={m.id} className="flex gap-2 items-center">
                    <div className="w-1/2 text-sm font-medium">{m.name}</div>
                    <Input
                      placeholder={t('programs_form_page.placeholders.discount')}
                      value={selectedModelDiscounts[m.id] ?? ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(parseCurrencyString(e.target.value));
                        setSelectedModelDiscounts(prev => ({ ...prev, [m.id]: formatted }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('programs_form_page.labels.start_date')}
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('programs_form_page.labels.end_date')}
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? t('programs_form_page.buttons.saving') : t('programs_form_page.buttons.submit')}
          </Button>
        </div>
      </main>
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
