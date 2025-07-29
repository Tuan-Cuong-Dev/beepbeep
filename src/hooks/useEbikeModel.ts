'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { EbikeModel } from '@/src/lib/vehicle-models/vehicleModelTypes';

interface UseEbikeModelFormOptions {
  companyId?: string;
  isAdmin?: boolean;
  onSaveComplete?: () => void;
}

export function useEbikeModelForm({
  companyId,
  isAdmin = false,
  onSaveComplete,
}: UseEbikeModelFormOptions) {
  const [models, setModels] = useState<EbikeModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdateModeModel, setIsUpdateModeModel] = useState(false);

  const defaultModel: EbikeModel = {
    id: '',
    companyId: companyId ?? '',
    name: '',
    description: '',
    batteryCapacity: '',
    motorPower: 0,
    topSpeed: 0,
    range: 0,
    weight: 0,
    maxLoad: undefined,
    pricePerDay: 0,
    pricePerHour: undefined,
    pricePerWeek: undefined,
    pricePerMonth: undefined,
    imageUrl: '',
    available: true,
  };

  const [newEbikeModel, setNewEbikeModel] = useState<EbikeModel>(defaultModel);

  const handleChange = <K extends keyof EbikeModel>(key: K, value: EbikeModel[K]) => {
    setNewEbikeModel((prev) => ({ ...prev, [key]: value }));
  };

  const setEditModel = (model: EbikeModel) => {
    setNewEbikeModel(model);
    setIsUpdateModeModel(true);
  };

  const resetForm = () => {
    setNewEbikeModel({
      ...defaultModel,
      companyId: companyId ?? '',
    });
    setIsUpdateModeModel(false);
  };

  const fetchModels = async () => {
    try {
      if (!isAdmin && (!companyId || companyId.trim() === '')) {
        console.warn('⚠️ Skipped fetchModels due to empty companyId');
        return;
      }

      const q = isAdmin
        ? collection(db, 'ebikeModels')
        : query(collection(db, 'ebikeModels'), where('companyId', '==', companyId));

      const snapshot = await getDocs(q);
      const data: EbikeModel[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<EbikeModel, 'id'>),
      }));

      console.log('✅ Loaded models:', data.length);
      setModels(data);
    } catch (error) {
      console.error('❌ Failed to fetch vehicle models:', error);
    }
  };

  const handleSave = async () => {
    if (!newEbikeModel.name || !newEbikeModel.description) {
      alert('Please fill out required fields.');
      return;
    }

    setLoading(true);

    const dataToSave: Omit<EbikeModel, 'id'> = {
      ...newEbikeModel,
      companyId: companyId ?? '',
      batteryCapacity: newEbikeModel.batteryCapacity,
      motorPower: Number(newEbikeModel.motorPower),
      topSpeed: Number(newEbikeModel.topSpeed),
      range: Number(newEbikeModel.range),
      weight: Number(newEbikeModel.weight),
      pricePerDay: Number(newEbikeModel.pricePerDay),
      available: !!newEbikeModel.available,
      updatedAt: serverTimestamp(),
      createdAt: isUpdateModeModel ? newEbikeModel.createdAt : serverTimestamp(),
      ...(newEbikeModel.maxLoad !== undefined && { maxLoad: Number(newEbikeModel.maxLoad) }),
      ...(newEbikeModel.pricePerHour !== undefined && { pricePerHour: Number(newEbikeModel.pricePerHour) }),
      ...(newEbikeModel.pricePerWeek !== undefined && { pricePerWeek: Number(newEbikeModel.pricePerWeek) }),
      ...(newEbikeModel.pricePerMonth !== undefined && { pricePerMonth: Number(newEbikeModel.pricePerMonth) }),
      ...(newEbikeModel.imageUrl && { imageUrl: newEbikeModel.imageUrl }),
    };

    try {
      if (isUpdateModeModel && newEbikeModel.id) {
        await updateDoc(doc(db, 'ebikeModels', newEbikeModel.id), dataToSave);
      } else {
        const docRef = await addDoc(collection(db, 'ebikeModels'), { ...dataToSave, id: '' });
        await updateDoc(docRef, { id: docRef.id });
      }

      await fetchModels();
      resetForm();
      onSaveComplete?.();
    } catch (error) {
      console.error('❌ Failed to save vehicle model:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || (companyId && companyId.trim() !== '')) {
      fetchModels();
    }
  }, [companyId, isAdmin]);

  return {
    models,
    setModels,
    newEbikeModel,
    setNewEbikeModel,
    handleChange,
    handleSave,
    setEditModel,
    resetForm,
    isUpdateModeModel,
    setIsUpdateModeModel,
    loading,
    fetchModels,
  };
}
