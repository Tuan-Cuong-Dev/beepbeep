// 📁 components/vehicleModels/VehicleModelTable.tsx
'use client';

import { useState } from 'react';
import { VehicleModel } from '@/src/lib/vehicleModels/vehicleModelTypes_new';
import {
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from '@/src/lib/vehicleModels/vehicleModelTypes_new';
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

export default function VehicleModelTable({
  companyId,
  models,
  onEdit,
  onReload,
}: Props) {
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    onConfirm: undefined as (() => void) | undefined,
  });

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(models.length / ITEMS_PER_PAGE);
  const pagedModels = models.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const confirmDelete = (id: string) => {
    setDialog({
      open: true,
      title: 'Delete this vehicle model?',
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Vehicle Models</h2>

      {/* Table for desktop */}
      <div className="hidden md:block overflow-x-auto text-sm">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Image</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Fuel</th>
              <th className="px-3 py-2 border">Battery</th>
              <th className="px-3 py-2 border">Motor</th>
              <th className="px-3 py-2 border">Top Speed</th>
              <th className="px-3 py-2 border">Range</th>
              <th className="px-3 py-2 border">Seats</th>
              <th className="px-3 py-2 border">Weight</th>
              <th className="px-3 py-2 border">Load</th>
              <th className="px-3 py-2 border">Price (Hour)</th>
              <th className="px-3 py-2 border">Price (Day)</th>
              <th className="px-3 py-2 border">Price (Week)</th>
              <th className="px-3 py-2 border">Price (Month)</th>
              <th className="px-3 py-2 border">Available</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedModels.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      width={60}
                      height={40}
                      className="rounded object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 italic">No image</span>
                  )}
                </td>
                <td className="border px-2 py-1 max-w-[160px] truncate">
                  {model.name}
                </td>
                <td className="border px-2 py-1">
                  {VEHICLE_TYPE_LABELS[model.vehicleType]}
                </td>
                <td className="border px-2 py-1">
                  {model.fuelType ? FUEL_TYPE_LABELS[model.fuelType] : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.batteryCapacity || '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.motorPower ? `${model.motorPower}W` : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.topSpeed ? `${model.topSpeed} km/h` : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.range ? `${model.range} km` : '-'}
                </td>
                <td className="border px-2 py-1">{model.capacity || '-'}</td>
                <td className="border px-2 py-1">
                  {model.weight ? `${model.weight} kg` : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.maxLoad ? `${model.maxLoad} kg` : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.pricePerHour ? formatCurrency(model.pricePerHour) : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.pricePerDay ? formatCurrency(model.pricePerDay) : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.pricePerWeek ? formatCurrency(model.pricePerWeek) : '-'}
                </td>
                <td className="border px-2 py-1">
                  {model.pricePerMonth
                    ? formatCurrency(model.pricePerMonth)
                    : '-'}
                </td>
                <td className="border px-2 py-1 text-center">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      model.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {model.available ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="border px-2 py-1 space-x-1">
                  <Button size="sm" onClick={() => onEdit(model)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirmDelete(model.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card for mobile */}
      <div className="md:hidden grid gap-4">
        {pagedModels.map((model) => (
          <div
            key={model.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex gap-3 items-start">
              {model.imageUrl ? (
                <Image
                  src={model.imageUrl}
                  alt={model.name}
                  width={80}
                  height={60}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-20 h-14 bg-gray-200 rounded" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{model.name}</h3>
                <p className="text-xs text-gray-500">
                  {VEHICLE_TYPE_LABELS[model.vehicleType]} ·{' '}
                  {model.fuelType ? FUEL_TYPE_LABELS[model.fuelType] : '-'}
                </p>
                <p className="text-sm mt-1">
                  {model.pricePerDay
                    ? formatCurrency(model.pricePerDay)
                    : '—'}{' '}
                  / day
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 text-sm">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  model.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {model.available ? 'Available' : 'Unavailable'}
              </span>
              <div className="space-x-1">
                <Button size="sm" onClick={() => onEdit(model)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => confirmDelete(model.id)}
                >
                  Delete
                </Button>
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
            className={`px-3 py-1 rounded border ${
              p === page
                ? 'bg-[#00d289] text-white border-[#00d289]'
                : 'hover:bg-gray-100'
            }`}
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
