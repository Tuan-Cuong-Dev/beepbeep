'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { VehicleModel } from '@/src/lib/vehicleModels/vehicleModelTypes_new';
import { useVehicleModelForm } from '@/src/hooks/useVehicleModelForm';
import VehicleModelForm from './VehicleModelForm';
import VehicleModelTable from './VehicleModelTable';
import { useUserRole } from '@/src/hooks/useUserRole'; 
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';

export default function VehicleModelManagementPage() {
  const { role, loading } = useUserRole(); // ✅ Dùng hook phân quyền
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

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
      ...docSnap.data(),
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

  if (loading) return <p className="text-center text-gray-500 py-10">🔄 Loading...</p>;
  if (role !== 'admin') return <p className="text-center text-red-600 py-10">🚫 Access denied</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <h1 className="text-2xl font-semibold mb-4 border-b-2 p-6 pb-2">Vehicle Model Management</h1>

      <VehicleModelForm
        companyId="admin-global"
        newModel={newModel}
        handleChange={handleChange}
        handleSave={handleSave}
        isUpdateModeModel={isUpdateMode}
        loading={loadingData}
      />

      <VehicleModelTable
        companyId="admin-global"
        models={models}
        onEdit={handleEdit}
        onReload={fetchModels}
      />
      <Footer />
    </div>
  );
}
