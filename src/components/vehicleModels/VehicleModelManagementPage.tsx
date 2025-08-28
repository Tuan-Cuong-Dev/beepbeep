'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { useVehicleModelForm } from '@/src/hooks/useVehicleModelForm';
import VehicleModelForm from './VehicleModelForm';
import VehicleModelTable from './VehicleModelTable';
import { useUserRole } from '@/src/hooks/useUserRole';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useTranslation } from 'react-i18next';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export default function VehicleModelManagementPage() {
  const { t } = useTranslation('common');
  const { role, loading } = useUserRole();

  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // 🔎 Simple search state
  const [searchTerm, setSearchTerm] = useState('');

  const {
    form: newModel,
    setForm,
    handleChange,
    handleNumberChange,
    handleStringChange,
    toggleAvailable,
    resetForm,
  } = useVehicleModelForm();

  const fetchModels = async () => {
    setLoadingData(true);
    const q = query(collection(db, 'vehicleModels'), where('companyId', '==', 'admin-global'));
    const snap = await getDocs(q);
    const result: VehicleModel[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as any),
    })) as VehicleModel[];
    setModels(result);
    setLoadingData(false);
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchModels();
    }
  }, [role]);

  const handleSave = async () => {
    if (!newModel.name || !newModel.description) return;
    setLoadingData(true);

    try {
      if (isUpdateMode && newModel.id) {
        await updateDoc(doc(db, 'vehicleModels', newModel.id), {
          ...newModel,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'vehicleModels'), {
          ...newModel,
          companyId: 'admin-global',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      resetForm();
      setIsUpdateMode(false);
      fetchModels();
    } catch (err) {
      console.error('🚫 Failed to save model:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEdit = (model: VehicleModel) => {
    setForm(model);
    setIsUpdateMode(true);
  };

  // 🧮 Filtered list (client-side search by name/description)
  const filteredModels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return models;
    return models.filter((m) =>
      [m.name, m.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [models, searchTerm]);

  if (loading)
    return <p className="text-center text-gray-500 py-10">🔄 {t('loading')}</p>;

  if (role !== 'admin')
    return <p className="text-center text-red-600 py-10">🚫 {t('access_denied')}</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold mb-1 border-b-2 pb-2">
            {t('vehicle_model_management_page.title')}
          </h1>
          <div className="text-sm text-gray-600">
            {t('vehicle_model_management_page.count', { count: filteredModels.length })}
          </div>
        </div>

        {/* 🔎 Simple search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl shadow">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">{t('filters.search')}</label>
            <Input
              placeholder={t('vehicle_model_management_page.search_placeholder', 'Search models by name or description…')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSearchTerm('')}
              disabled={!searchTerm}
            >
              {t('filters.clear')}
            </Button>
            <Button variant="outline" onClick={fetchModels}>⟳ {t('vehicle_model_management_page.refresh_models', 'Refresh Models')}</Button>
          </div>
        </div>

        <VehicleModelTable
          companyId="admin-global"
          models={filteredModels}
          onEdit={handleEdit}
          onReload={fetchModels}
        />
        
        <VehicleModelForm
          companyId="admin-global"
          newModel={newModel}
          handleChange={handleChange}
          handleSave={handleSave}
          isUpdateModeModel={isUpdateMode}
          loading={loadingData}
        />
      </main>

      <Footer />
    </div>
  );
}
