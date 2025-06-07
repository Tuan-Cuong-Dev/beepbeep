'use client';

import { useState } from 'react';
import { EbikeModel } from '@/src/lib/ebikemodels/ebikeModelTypes';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  companyId: string;
  models: EbikeModel[]; // ✅ dùng models truyền từ props
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
          onReload?.(); // Gọi reload bên ngoài nếu cần
        } catch (err) {
          console.error('❌ Failed to delete Vehicle model:', err);
        } finally {
          setDialog({ open: false, title: '', onConfirm: undefined });
        }
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow overflow-x-auto mt-6">
      <h2 className="text-xl font-semibold mb-4">Vehicle Models</h2>

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
              <td className="px-3 py-2 border whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                {model.name}
              </td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.batteryCapacity}</td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.motorPower} W</td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.topSpeed} km/h</td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.range} km</td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.weight} kg</td>
              <td className="px-3 py-2 border whitespace-nowrap">{model.maxLoad ?? '-'} kg</td>
              <td className="px-3 py-2 border whitespace-nowrap">
                {model.pricePerHour ? formatCurrency(model.pricePerHour) : '-'}
              </td>
              <td className="px-3 py-2 border whitespace-nowrap">
                {model.pricePerDay ? formatCurrency(model.pricePerDay) : '-'}
              </td>
              <td className="px-3 py-2 border whitespace-nowrap">
                {model.pricePerWeek ? formatCurrency(model.pricePerWeek) : '-'}
              </td>
              <td className="px-3 py-2 border whitespace-nowrap">
                {model.pricePerMonth ? formatCurrency(model.pricePerMonth) : '-'}
              </td>
              <td className="px-3 py-2 border whitespace-nowrap">
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
