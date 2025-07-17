'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicle: PersonalVehicle_new;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditPersonalVehicleForm({ vehicle, onSaved, onCancel }: Props) {
  const { t } = useTranslation('common');
  const [name, setName] = useState(vehicle.name);
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || '');
  const [year, setYear] = useState(vehicle.yearOfManufacture || undefined);
  const [odo, setOdo] = useState(vehicle.odo || undefined);
  const [isPrimary, setIsPrimary] = useState(vehicle.isPrimary);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'personalVehicles', vehicle.id), {
        name,
        licensePlate,
        yearOfManufacture: year,
        odo,
        isPrimary,
        updatedAt: new Date(),
      });
      onSaved();
    } catch (err) {
      console.error('❌ Update failed:', err);
      alert(t('edit_personal_vehicle_form.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded bg-white space-y-4 max-w-xl mx-auto">
      <h3 className="text-lg font-semibold">✏️ {t('edit_personal_vehicle_form.title')}</h3>

      <Input placeholder={t('edit_personal_vehicle_form.name')} value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder={t('edit_personal_vehicle_form.license_plate')} value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
      <Input
        type="number"
        placeholder={t('edit_personal_vehicle_form.year')}
        value={year || ''}
        onChange={(e) => setYear(parseInt(e.target.value) || undefined)}
      />
      <Input
        type="number"
        placeholder={t('edit_personal_vehicle_form.odo')}
        value={odo || ''}
        onChange={(e) => setOdo(parseInt(e.target.value) || undefined)}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          id="primary-edit"
        />
        <label htmlFor="primary-edit">{t('edit_personal_vehicle_form.set_primary')}</label>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? t('edit_personal_vehicle_form.saving') : `💾 ${t('edit_personal_vehicle_form.save')}`}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('edit_personal_vehicle_form.cancel')}
        </Button>
      </div>
    </div>
  );
}
