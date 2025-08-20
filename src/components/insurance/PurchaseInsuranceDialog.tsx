'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes';
import { useUserPersonalVehicles } from '@/src/hooks/useUserPersonalVehicles';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (vehicle: PersonalVehicle_new) => void;
}

export default function PurchaseInsuranceDialog({
  open,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation('common');
  const { vehicles } = useUserPersonalVehicles();
  const [selectedId, setSelectedId] = useState('');

  const motorbikeVehicles = vehicles.filter((v) => v.vehicleType === 'motorbike');
  const selected = motorbikeVehicles.find((v) => v.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('purchase_insurance_dialog.title')}</DialogTitle>
        </DialogHeader>

        {motorbikeVehicles.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('purchase_insurance_dialog.no_motorbike')}
          </p>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">
                {t('purchase_insurance_dialog.select_placeholder')}
              </option>
              {motorbikeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.licensePlate || t('purchase_insurance_dialog.no_plate')})
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-3 border p-3 rounded text-sm text-gray-600 space-y-1">
                <p>
                  <strong>{t('purchase_insurance_dialog.name')}:</strong> {selected.name}
                </p>
                <p>
                  <strong>{t('purchase_insurance_dialog.license_plate')}:</strong>{' '}
                  {selected.licensePlate || 'N/A'}
                </p>
                <p>
                  <strong>{t('purchase_insurance_dialog.brand')}:</strong>{' '}
                  {selected.brand || 'N/A'}
                </p>
                <p>
                  <strong>{t('purchase_insurance_dialog.model')}:</strong>{' '}
                  {selected.model || 'N/A'}
                </p>
                <p>
                  <strong>{t('purchase_insurance_dialog.color')}:</strong>{' '}
                  {selected.color || 'N/A'}
                </p>
                <p>
                  <strong>{t('purchase_insurance_dialog.odo')}:</strong>{' '}
                  {selected.odo ? `${selected.odo} km` : 'N/A'}
                </p>
              </div>
            )}

            <Button
              disabled={!selected}
              className="mt-4 w-full"
              onClick={() => selected && onConfirm(selected)}
            >
              ✅ {t('purchase_insurance_dialog.confirm_button')}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
