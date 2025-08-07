'use client';

import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
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

export default function ProgramsFormPage() {
  const { t } = useTranslation('common');
  const { user, role, companyId } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [selectedModelDiscounts, setSelectedModelDiscounts] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === 'Admin';
  const isCompanyRole = role === 'company_owner' || role === 'private_provider';

  useEffect(() => {
    if (isAdmin) {
      getDocs(collection(db, 'rentalCompanies')).then(snapshot => {
        const companiesList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCompanies(companiesList);
      });
    } else if (isCompanyRole) {
      setSelectedCompanyId(companyId ?? null);
    }
  }, [isAdmin, isCompanyRole, companyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', selectedCompanyId))).then(snapshot => {
      const stationsList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setStations(stationsList);
    });

    getDocs(query(collection(db, 'ebikeModels'), where('companyId', '==', selectedCompanyId))).then(snapshot => {
      const modelsList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setModels(modelsList);
    });
  }, [selectedCompanyId]);

  const handleSubmit = async () => {
    if (!title || !description || !selectedCompanyId || Object.keys(selectedModelDiscounts).length === 0) {
      setNotification({ type: 'error', message: t('programs_form_page.validation.fill_required') });
      return;
    }

    setIsSubmitting(true);

    try {
      const programType: ProgramType = isCompanyRole ? 'rental_program' : 'agent_program';

      const parsedDiscounts: Record<string, number> = {};
      Object.entries(selectedModelDiscounts).forEach(([modelId, value]) => {
        parsedDiscounts[modelId] = parseCurrencyString(value);
      });

      await addDoc(collection(db, 'programs'), {
        title,
        description,
        type: programType,
        companyId: selectedCompanyId,
        stationIds: selectedStationIds,
        modelDiscounts: parsedDiscounts,
        startDate: stringToTimestamp(startDate),
        endDate: stringToTimestamp(endDate),
        createdByUserId: user?.uid,
        createdByRole: (role || '').toLowerCase(),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotification({ type: 'success', message: t('programs_form_page.messages.success') });
      setTimeout(() => router.push('/dashboard/programs'), 1000);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: t('programs_form_page.messages.error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStation = (stationId: string) => {
    setSelectedStationIds(prev =>
      prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
    );
  };

  return (
    <>
      <Header />

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t('programs_form_page.title')}</h1>

        {isAdmin && (
          <SimpleSelect
            options={companies.map(c => ({ value: c.id, label: c.name }))}
            placeholder={t('programs_form_page.placeholders.select_company')}
            value={selectedCompanyId ?? ''}
            onChange={(val) => setSelectedCompanyId(val)}
          />
        )}

        <Input placeholder={t('programs_form_page.placeholders.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder={t('programs_form_page.placeholders.description')} value={description} onChange={(e) => setDescription(e.target.value)} />

        {stations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('programs_form_page.labels.select_stations')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {stations.map(station => (
                <Button
                  variant={selectedStationIds.includes(station.id) ? "default" : "outline"}
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                >
                  {station.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {models.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('programs_form_page.labels.set_discounts')}</h3>
            {models.map(model => (
              <div key={model.id} className="flex gap-2 items-center mb-2">
                <div className="w-1/3">{model.name}</div>
                <Input
                  placeholder={t('programs_form_page.placeholders.discount')}
                  value={selectedModelDiscounts[model.id] ?? ''}
                  onChange={(e) => {
                    const formatted = formatCurrency(parseCurrencyString(e.target.value));
                    setSelectedModelDiscounts(prev => ({ ...prev, [model.id]: formatted }))
                  }}
                />
              </div>
            ))}
          </div>
        )}

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

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t('programs_form_page.buttons.saving') : t('programs_form_page.buttons.submit')}
        </Button>
      </div>

      <Footer />

      {notification && (
        <NotificationDialog
          open={true}
          type={notification.type}
          title={t(`programs_form_page.notification.${notification.type}`)}
          description={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}