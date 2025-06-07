'use client';

import { useState } from 'react';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';

export function useEbikeForm(companyId: string, onSaveComplete?: () => void) {
  const [loading, setLoading] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const emptyEbike: Ebike = {
    id: '',
    companyId,
    modelId: '',
    stationId: '',
    serialNumber: '',
    vehicleID: '',
    plateNumber: '',
    odo: 0,
    color: '',
    status: 'Available',
    currentLocation: '',
    lastMaintained: null,
    batteryCapacity: '', // ✅ chuyển sang string
    range: 0,
    pricePerDay: 0,
    pricePerHour: undefined,
    pricePerWeek: undefined,
    pricePerMonth: undefined,
  };

  const [ebike, setEbike] = useState<Ebike>(emptyEbike);

  const handleChange = <K extends keyof Ebike>(key: K, value: Ebike[K]) => {
    setEbike((prev) => ({ ...prev, [key]: value }));
  };

  const setEditEbike = (edit: Ebike) => {
    setEbike({
      ...edit,
      modelId: edit.modelId || '',
      stationId: edit.stationId || '',
    });
    setIsUpdateMode(true);
  };

  const resetForm = () => {
    setEbike({
      ...emptyEbike,
      companyId,
    });
    setIsUpdateMode(false);
  };

  const handleSave = async () => {
    if (!ebike.modelId || !ebike.serialNumber) {
      alert('Please fill required fields.');
      return;
    }

    setLoading(true);

    const payload = {
      ...ebike,
      companyId,
      odo: Number(ebike.odo),
      batteryCapacity: Number(ebike.batteryCapacity),
      range: Number(ebike.range),
      pricePerDay: Number(ebike.pricePerDay),
      pricePerHour: ebike.pricePerHour !== undefined ? Number(ebike.pricePerHour) : undefined,
      pricePerWeek: ebike.pricePerWeek !== undefined ? Number(ebike.pricePerWeek) : undefined,
      pricePerMonth: ebike.pricePerMonth !== undefined ? Number(ebike.pricePerMonth) : undefined,
      lastMaintained: ebike.lastMaintained ?? null, // ❗ giữ nguyên, chưa xử lý auto timestamp
      updatedAt: serverTimestamp(),
      createdAt: isUpdateMode ? ebike.createdAt : serverTimestamp(),
    };

    try {
      if (isUpdateMode && ebike.id) {
        await updateDoc(doc(db, 'ebikes', ebike.id), payload);
      } else {
        const docRef = await addDoc(collection(db, 'ebikes'), { ...payload, id: '' });
        await updateDoc(docRef, { id: docRef.id });
      }

      onSaveComplete?.();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to save ebike:', err);
      // ❗ Không reset nếu fail, để user sửa lại form
    } finally {
      setLoading(false);
    }
  };

  return {
    ebike,
    setEbike,
    setEditEbike,
    isUpdateMode,
    setIsUpdateMode,
    handleChange,
    handleSave,
    resetForm,
    loading,
  };
}
