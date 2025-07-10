'use client';

import { useState } from 'react';
import { EbikeModel } from '@/src/lib/vehicleModels/vehicleModelTypes';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  companyId: string;
  models: EbikeModel[];
  onEdit: (model: EbikeModel) => void;
  onReload?: () => void;
  reloadTrigger?: boolean;
}

export default function EbikeModelTable({
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

  const confirmDelete = (id: string) => {
    setDialog({
      open: true,
      title: 'Delete this Vehicle Model?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'ebikeModels', id));
          onReload?.();
        } catch (err) {
          console.error('❌ Failed to delete Vehicle model:', err);
        } finally {
          setDialog({ open: false, title: '', onConfirm: undefined });
        }
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Vehicle Models</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 border">Image</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Battery</th>
              <th className="px-3 py-2 border">Motor</th>
              <th className="px-3 py-2 border">Top Speed</th>
              <th className="px-3 py-2 border">Range</th>
              <th className="px-3 py-2 border">Weight</th>
              <th className="px-3 py-2 border">Max Load</th>
              <th className="px-3 py-2 border">Price/Hour</th>
              <th className="px-3 py-2 border">Price/Day</th>
              <th className="px-3 py-2 border">Price/Week</th>
              <th className="px-3 py-2 border">Price/Month</th>
              <th className="px-3 py-2 border">Available</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border whitespace-nowrap">
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      width={60}
                      height={40}
                      className="rounded object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 italic">No Image</span>
                  )}
                </td>
                <td className="px-3 py-2 border max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {model.name}
                </td>
                <td className="px-3 py-2 border">{model.batteryCapacity}</td>
                <td className="px-3 py-2 border">{model.motorPower} W</td>
                <td className="px-3 py-2 border">{model.topSpeed} km/h</td>
                <td className="px-3 py-2 border">{model.range} km</td>
                <td className="px-3 py-2 border">{model.weight} kg</td>
                <td className="px-3 py-2 border">{model.maxLoad ?? '-'} kg</td>
                <td className="px-3 py-2 border">
                  {model.pricePerHour ? formatCurrency(model.pricePerHour) : '-'}
                </td>
                <td className="px-3 py-2 border">
                  {model.pricePerDay ? formatCurrency(model.pricePerDay) : '-'}
                </td>
                <td className="px-3 py-2 border">
                  {model.pricePerWeek ? formatCurrency(model.pricePerWeek) : '-'}
                </td>
                <td className="px-3 py-2 border">
                  {model.pricePerMonth ? formatCurrency(model.pricePerMonth) : '-'}
                </td>
                <td className="px-3 py-2 border">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      model.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {model.available ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-3 py-2 border whitespace-nowrap flex flex-col sm:flex-row gap-1">
                  <Button size="sm" variant="default" onClick={() => onEdit(model)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => confirmDelete(model.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {models.map((model) => (
          <div key={model.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-4">
              {model.imageUrl ? (
                <Image
                  src={model.imageUrl}
                  alt={model.name}
                  width={80}
                  height={60}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-20 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-sm italic">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold">{model.name}</h3>
                <p className="text-sm text-gray-500">{model.batteryCapacity} | {model.motorPower}W</p>
                <p className="text-sm text-gray-500">{model.range}km • {model.topSpeed}km/h</p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Price/Day:</span>{' '}
                  {model.pricePerDay ? formatCurrency(model.pricePerDay) : '-'}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => onEdit(model)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => confirmDelete(model.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
