'use client';

import { useState } from 'react';
import { Accessory } from '@/src/lib/accessories/accessoryTypes';
import { Button } from '@/src/components/ui/button';
import AccessoryExportForm from '@/src/components/accessories/AccessoryExportForm';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { formatCurrency } from '@/src/utils/formatCurrency'; // ✅ Thêm nếu bạn đã có

interface Props {
  accessories: Accessory[];
  onEdit?: (item: Accessory) => void;
  onDelete?: (id: string) => void;
  onUpdateAccessory?: (updated: Accessory) => void;
}

export default function AccessoryTable({
  accessories,
  onEdit,
  onDelete,
  onUpdateAccessory,
}: Props) {
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  const sortedAccessories = [...accessories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Code / Quantity</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Import Date</th>
            <th className="p-2 text-left">Import Price</th>
            <th className="p-2 text-left">Retail Price</th>
            <th className="p-2 text-left">Notes</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAccessories.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{a.name}</td>
              <td className="p-2 capitalize">{a.type}</td>
              <td className="p-2">
                {a.type === 'tracked' ? a.code : `${a.quantity ?? 0} pcs`}
              </td>
              <td className="p-2 capitalize">{a.status}</td>
              <td className="p-2">
                {a.importDate?.toDate().toLocaleDateString('en-GB') || '-'}
              </td>
              <td className="p-2">
                {a.importPrice != null ? formatCurrency(a.importPrice) : '-'}
              </td>
              <td className="p-2">
                {a.retailPrice != null ? formatCurrency(a.retailPrice) : '-'}
              </td>
              <td className="p-2 whitespace-pre-line break-words">
                {a.notes || '-'}
              </td>
              <td className="p-2">
                {onEdit && onDelete && onUpdateAccessory ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" onClick={() => onEdit(a)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(a.id)}
                    >
                      Delete
                    </Button>
                    <Dialog
                      onOpenChange={(open) => {
                        if (!open) setSelectedAccessory(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedAccessory(a)}
                        >
                          Export
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogTitle>Export Accessory</DialogTitle>
                        {selectedAccessory && (
                          <AccessoryExportForm
                            defaultAccessory={selectedAccessory}
                            onComplete={(updatedAccessory: Accessory) => {
                              onUpdateAccessory(updatedAccessory);
                              setSelectedAccessory(null);
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <span className="text-gray-400">View only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
