// 📁 components/vehicleModels/VehicleModelTable.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { VEHICLE_SUBTYPE_LABELS, VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { formatCurrency } from '@/src/utils/formatCurrency';
import Image from 'next/image';

interface Props {
  companyId: string;
  models: VehicleModel[];
  onEdit: (model: VehicleModel) => void;
  onReload?: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function VehicleModelTable({ companyId, models, onEdit, onReload }: Props) {
  const { t } = useTranslation('common');
  const [dialog, setDialog] = useState({ open: false, title: '', onConfirm: undefined as (() => void) | undefined });
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(models.length / ITEMS_PER_PAGE);
  const pagedModels = models.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const confirmDelete = (id: string) => {
    setDialog({
      open: true,
      title: t('vehicle_model_table.delete_confirm'),
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'vehicleModels', id));
          onReload?.();
        } catch (err) {
          console.error('❌ Failed to delete:', err);
        } finally {
          setDialog({ open: false, title: '', onConfirm: undefined });
        }
      },
    });
  };

  const getDirectImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    const id = match?.[1];
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  };

  const getVehicleTypeLabel = (key: string) => t(`vehicle_model_form.vehicle_type.${key}`);
  const getFuelTypeLabel = (key: string) => t(`vehicle_model_form.fuel_type.${key}`);
  const getSubTypeLabel = (key: string) => t(`vehicle_model_form.sub_type.${key}`);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-bold mb-4">{t('vehicle_model_table.title')}</h2>

      {/* Table for desktop */}
      <div className="hidden md:block overflow-x-auto text-sm">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['image', 'name', 'type', 'sub_type', 'brand', 'fuel', 'battery', 'motor', 'top_speed', 'range', 'seats', 'weight', 'load', 'price_hour', 'price_day', 'price_week', 'price_month', 'available', 'actions'].map((key) => (
                <th key={key} className="px-3 py-2 border">{t(`vehicle_model_table.headers.${key}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedModels.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  {model.imageUrl ? (
                    <Image src={getDirectImageUrl(model.imageUrl) as string} alt={model.name} width={60} height={40} className="rounded object-cover" />
                  ) : (
                    <span className="text-gray-400 italic">{t('vehicle_model_table.no_image')}</span>
                  )}
                </td>
                <td className="border px-2 py-1 max-w-[160px] truncate">{model.name}</td>
                <td className="border px-2 py-1">{getVehicleTypeLabel(model.vehicleType)}</td>
                <td className="border px-2 py-1">{model.vehicleSubType ? getSubTypeLabel(model.vehicleSubType) || model.vehicleSubType : '-'}</td>
                <td className="border px-2 py-1">{model.brand || '-'}</td>
                <td className="border px-2 py-1">{model.fuelType ? getFuelTypeLabel(model.fuelType) : '-'}</td>
                <td className="border px-2 py-1">{model.batteryCapacity || '-'}</td>
                <td className="border px-2 py-1">{model.motorPower ? `${model.motorPower}W` : '-'}</td>
                <td className="border px-2 py-1">{model.topSpeed ? `${model.topSpeed} km/h` : '-'}</td>
                <td className="border px-2 py-1">{model.range ? `${model.range} km` : '-'}</td>
                <td className="border px-2 py-1">{model.capacity || '-'}</td>
                <td className="border px-2 py-1">{model.weight ? `${model.weight} kg` : '-'}</td>
                <td className="border px-2 py-1">{model.maxLoad ? `${model.maxLoad} kg` : '-'}</td>
                <td className="border px-2 py-1">{model.pricePerHour ? formatCurrency(model.pricePerHour) : '-'}</td>
                <td className="border px-2 py-1">{model.pricePerDay ? formatCurrency(model.pricePerDay) : '-'}</td>
                <td className="border px-2 py-1">{model.pricePerWeek ? formatCurrency(model.pricePerWeek) : '-'}</td>
                <td className="border px-2 py-1">{model.pricePerMonth ? formatCurrency(model.pricePerMonth) : '-'}</td>
                <td className="border px-2 py-1 text-center">
                  <span className={`text-xs px-2 py-1 rounded ${model.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {model.available ? t('vehicle_model_table.available') : t('vehicle_model_table.unavailable')}
                  </span>
                </td>
                <td className="text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Button size="sm" onClick={() => onEdit(model)}>{t('vehicle_model_table.edit')}</Button>
                    <Button size="sm" variant="destructive" onClick={() => confirmDelete(model.id)}>{t('vehicle_model_table.delete')}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid gap-4">
        {pagedModels.map((model) => (
          <div key={model.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex gap-3 items-start">
              {model.imageUrl ? (
                <Image src={getDirectImageUrl(model.imageUrl) as string} alt={model.name} width={60} height={40} className="rounded object-cover" />
              ) : (
                <span className="text-gray-400 italic">{t('vehicle_model_table.no_image')}</span>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{model.name}</h3>
                <p className="text-xs text-gray-500">
                  {getVehicleTypeLabel(model.vehicleType)} · {model.fuelType ? getFuelTypeLabel(model.fuelType) : '-'}
                </p>
                <p className="text-sm mt-1">
                  {model.pricePerDay ? formatCurrency(model.pricePerDay) : '—'} / {t('vehicle_model_table.headers.price_day')}
                </p>
                <p className="text-sm mt-1">
                  {model.pricePerMonth ? formatCurrency(model.pricePerMonth) : '—'} / {t('vehicle_model_table.headers.price_month')}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 text-sm">
              <span className={`text-xs px-2 py-1 rounded ${model.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {model.available ? t('vehicle_model_table.available') : t('vehicle_model_table.unavailable')}
              </span>
              <div className="space-x-1">
                <Button size="sm" onClick={() => onEdit(model)}>{t('vehicle_model_table.edit')}</Button>
                <Button size="sm" variant="destructive" onClick={() => confirmDelete(model.id)}>{t('vehicle_model_table.delete')}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center gap-2 text-sm">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded border ${p === page ? 'bg-[#00d289] text-white border-[#00d289]' : 'hover:bg-gray-100'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <NotificationDialog
        open={dialog.open}
        title={dialog.title}
        type="confirm"
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
