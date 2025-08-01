'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accessory } from '@/src/lib/accessories/accessoryTypes';
import { Button } from '@/src/components/ui/button';
import AccessoryExportForm from '@/src/components/accessories/AccessoryExportForm';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useUser } from '@/src/context/AuthContext'; // ✅

interface Props {
  accessories: Accessory[];
  onEdit?: (item: Accessory) => void;
  onDelete?: (id: string) => void;
  onUpdateAccessory?: (updated: Accessory) => void;
  normalizedRole?: string; // ✅ Thêm dòng này
}

export default function AccessoryTable({
  accessories,
  onEdit,
  onDelete,
  onUpdateAccessory,
}: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser(); // ✅ lấy role từ AuthContext
  const isTechnician = role === 'technician';

  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  const sortedAccessories = [...accessories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="overflow-x-auto border rounded-lg bg-white shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">{t('accessory_table.name')}</th>
            <th className="p-2 text-left">{t('accessory_table.type')}</th>
            <th className="p-2 text-left">{t('accessory_table.code_quantity')}</th>
            <th className="p-2 text-left">{t('accessory_table.status')}</th>
            <th className="p-2 text-left">{t('accessory_table.import_date')}</th>
            {!isTechnician && (
              <th className="p-2 text-left">{t('accessory_table.import_price')}</th>
            )}
            <th className="p-2 text-left">{t('accessory_table.retail_price')}</th>
            <th className="p-2 text-left">{t('accessory_table.notes')}</th>
            {!isTechnician && (
              <th className="p-2 text-left">{t('accessory_table.actions')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedAccessories.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{a.name}</td>
              <td className="p-2 capitalize">{a.type}</td>
              <td className="p-2">
                {a.type === 'tracked'
                  ? a.code
                  : t('accessory_table.pcs', { qty: a.quantity ?? 0 })}
              </td>
              <td className="p-2 capitalize">{a.status}</td>
              <td className="p-2">
                {a.importDate?.toDate().toLocaleDateString('en-GB') || '-'}
              </td>
              {!isTechnician && (
                <td className="p-2">
                  {a.importPrice != null ? formatCurrency(a.importPrice) : '-'}
                </td>
              )}
              <td className="p-2">
                {a.retailPrice != null ? formatCurrency(a.retailPrice) : '-'}
              </td>
              <td className="p-2 whitespace-pre-line break-words">
                {a.notes || '-'}
              </td>
              {!isTechnician && (
                <td className="p-2">
                  {onEdit && onDelete && onUpdateAccessory ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" onClick={() => onEdit(a)}>
                        {t('accessory_table.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(a.id)}
                      >
                        {t('accessory_table.delete')}
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
                            {t('accessory_table.export')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogTitle>{t('accessory_table.export_title')}</DialogTitle>
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
                    <span className="text-gray-400">
                      {t('accessory_table.view_only')}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
