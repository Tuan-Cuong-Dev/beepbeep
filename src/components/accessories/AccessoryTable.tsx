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
import { useUser } from '@/src/context/AuthContext';

interface Props {
  accessories: Accessory[];
  onEdit?: (item: Accessory) => void;
  onDelete?: (id: string) => void;
  onUpdateAccessory?: (updated: Accessory) => void;
  normalizedRole?: string;
}

export default function AccessoryTable({
  accessories,
  onEdit,
  onDelete,
  onUpdateAccessory,
}: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isTechnician = role === 'technician';

  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  const sortedAccessories = [...accessories].sort((a, b) => a.name.localeCompare(b.name));

  // -------- MOBILE (cards) --------
  const MobileCards = (
    <div className="md:hidden space-y-3">
      {sortedAccessories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 bg-white border border-dashed border-gray-300 rounded-xl">
          <div className="text-3xl">🧰</div>
          <p className="text-sm text-gray-600">{t('accessory_table.no_result', 'No accessories found')}</p>
        </div>
      ) : (
        sortedAccessories.map((a) => {
          const isTracked = a.type === 'tracked';
          const codeOrQty =
            isTracked ? (a.code || '-') : t('accessory_table.pcs', { qty: a.quantity ?? 0 });

          return (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition hover:shadow-md"
            >
              {/* Header: name + status chip + import date */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t('accessory_table.import_date')}:{' '}
                    {a.importDate?.toDate().toLocaleDateString('en-GB') || '-'}
                  </div>
                </div>
                <span
                  className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs
                  bg-gray-100 text-gray-700 capitalize"
                >
                  {t(`accessory_management_page.status.${a.status}`, { defaultValue: a.status })}
                </span>
              </div>

              {/* Meta grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('accessory_table.type')}</div>
                  <div className="text-gray-800 capitalize">
                    {t(`accessory_management_page.options.accessory_type.${a.type}`, { defaultValue: a.type })}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('accessory_table.code_quantity')}</div>
                  <div className="text-gray-800">{codeOrQty}</div>
                </div>
                {!isTechnician && (
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-gray-500">{t('accessory_table.import_price')}</div>
                    <div className="text-gray-800">
                      {a.importPrice != null ? formatCurrency(a.importPrice) : '-'}
                    </div>
                  </div>
                )}
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('accessory_table.retail_price')}</div>
                  <div className="text-gray-800">
                    {a.retailPrice != null ? formatCurrency(a.retailPrice) : '-'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {a.notes ? (
                <div className="mt-3 text-sm text-gray-700">
                  <span className="text-xs text-gray-500">{t('accessory_table.notes')}</span>
                  <div className="mt-1 whitespace-pre-line break-words">{a.notes}</div>
                </div>
              ) : null}

              {/* Actions */}
              {!isTechnician ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {onEdit && (
                    <Button variant="outline" className="w-full" onClick={() => onEdit(a)}>
                      {t('accessory_table.edit')}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => onDelete(a.id)}
                    >
                      {t('accessory_table.delete')}
                    </Button>
                  )}
                  {onUpdateAccessory ? (
                    <Dialog
                      onOpenChange={(open) => {
                        if (!open) setSelectedAccessory(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          className="w-full"
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
                            onComplete={(updated: Accessory) => {
                              onUpdateAccessory(updated);
                              setSelectedAccessory(null);
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      {t('accessory_table.view_only')}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );

  // -------- DESKTOP (table) --------
  const DesktopTable = (
    <div className="hidden md:block overflow-x-auto border rounded-lg bg-white shadow">
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
              <td className="p-2 capitalize">
                {t(`accessory_management_page.options.accessory_type.${a.type}`, { defaultValue: a.type })}
              </td>
              <td className="p-2">
                {a.type === 'tracked'
                  ? a.code
                  : t('accessory_table.pcs', { qty: a.quantity ?? 0 })}
              </td>
              <td className="p-2 capitalize">
                {t(`accessory_management_page.status.${a.status}`, { defaultValue: a.status })}
              </td>
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
              <td className="p-2 whitespace-pre-line break-words">{a.notes || '-'}</td>
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
                              onComplete={(updated: Accessory) => {
                                onUpdateAccessory(updated);
                                setSelectedAccessory(null);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <span className="text-gray-400">{t('accessory_table.view_only')}</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {MobileCards}
      {DesktopTable}
    </div>
  );
}
