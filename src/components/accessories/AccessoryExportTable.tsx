'use client';

import { useEffect, useState } from 'react';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import { getUserNameById } from '@/src/lib/services/users/userService';
import { format } from 'date-fns';
import { Input } from '@/src/components/ui/input';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Button } from '@/src/components/ui/button';
import { importBackAccessory } from '@/src/lib/accessories/accessoryExportService';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  exports: AccessoryExport[];
}

export default function AccessoryExportTable({ exports }: Props) {
  const { t } = useTranslation();
  const { role } = useUser();
  const isTechnician = role === 'technician';

  const [exportedByMap, setExportedByMap] = useState<Record<string, string>>({});
  const [searchName, setSearchName] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [selectedItem, setSelectedItem] = useState<AccessoryExport | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueIds = [...new Set(exports.map((e) => e.exportedBy))];
      const map: Record<string, string> = {};
      for (const uid of uniqueIds) {
        const name = await getUserNameById(uid);
        map[uid] = name || uid;
      }
      setExportedByMap(map);
    };
    fetchUserNames();
  }, [exports]);

  const filtered = [...exports]
    .filter(
      (e) =>
        (e.accessoryName || '').toLowerCase().includes(searchName.toLowerCase()) &&
        (e.target || '').toLowerCase().includes(searchTarget.toLowerCase())
    )
    .sort((a, b) => b.exportedAt.toDate().getTime() - a.exportedAt.toDate().getTime());

  const handleImportConfirm = async () => {
    if (!selectedItem) return;
    setImportingId(selectedItem.id);
    try {
      await importBackAccessory(selectedItem);
      alert(t('accessory_export_table.success_message'));
    } catch (error) {
      console.error(error);
      alert(t('accessory_export_table.error_message'));
    } finally {
      setImportingId(null);
      setSelectedItem(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder={t('accessory_export_table.search_accessory')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-full"
        />
        <Input
          placeholder={t('accessory_export_table.search_target')}
          value={searchTarget}
          onChange={(e) => setSearchTarget(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="text-3xl">📦</div>
            <p className="text-sm text-gray-600">{t('accessory_export_table.no_result', 'No results')}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const exportedBy = exportedByMap[item.exportedBy] || item.exportedBy;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                {/* Header line: name + qty */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{item.accessoryName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(item.exportedAt.toDate(), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {t('accessory_export_table.quantity')}: {item.quantity}
                  </div>
                </div>

                {/* Meta info */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-gray-500">{t('accessory_export_table.target')}</div>
                    <div className="text-gray-800">{item.target || '-'}</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-gray-500">{t('accessory_export_table.exported_by')}</div>
                    <div className="text-gray-800 truncate">{exportedBy}</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-gray-500">{t('accessory_export_table.import_price')}</div>
                    <div className="text-gray-800">{formatCurrency(item.importPrice || 0)}</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-gray-500">{t('accessory_export_table.retail_price')}</div>
                    <div className="text-gray-800">{formatCurrency(item.retailPrice || 0)}</div>
                  </div>
                </div>

                {/* Note */}
                {item.note ? (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="text-xs text-gray-500">{t('accessory_export_table.note')}</span>
                    <div className="mt-1">{item.note}</div>
                  </div>
                ) : null}

                {/* Actions */}
                {!isTechnician && (
                  <div className="mt-4">
                    <Dialog
                      open={selectedItem?.id === item.id}
                      onOpenChange={(open) => !open && setSelectedItem(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedItem(item)}
                          disabled={importingId === item.id}
                        >
                          {importingId === item.id
                            ? t('accessory_export_table.importing')
                            : t('accessory_export_table.import_back')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('accessory_export_table.confirm_title')}</DialogTitle>
                          <DialogDescription>
                            {t('accessory_export_table.confirm_message', {
                              name: item.accessoryName,
                              qty: item.quantity,
                            })}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedItem(null)}>
                            {t('accessory_export_table.cancel')}
                          </Button>
                          <Button onClick={handleImportConfirm} disabled={importingId === item.id}>
                            {importingId === item.id
                              ? t('accessory_export_table.importing')
                              : t('accessory_export_table.confirm')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">{t('accessory_export_table.accessory')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.quantity')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.target')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.import_price')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.retail_price')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.note')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.exported_by')}</th>
              <th className="p-2 text-left">{t('accessory_export_table.date')}</th>
              {!isTechnician && (
                <th className="p-2 text-right">{t('accessory_export_table.actions')}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.accessoryName}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">{item.target}</td>
                <td className="p-2">{formatCurrency(item.importPrice || 0)}</td>
                <td className="p-2">{formatCurrency(item.retailPrice || 0)}</td>
                <td className="p-2">{item.note}</td>
                <td className="p-2 whitespace-nowrap">
                  {exportedByMap[item.exportedBy] || item.exportedBy}
                </td>
                <td className="p-2 whitespace-nowrap">
                  {format(item.exportedAt.toDate(), 'dd/MM/yyyy')}
                </td>
                {!isTechnician && (
                  <td className="p-2 text-right">
                    <Dialog
                      open={selectedItem?.id === item.id}
                      onOpenChange={(open) => !open && setSelectedItem(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                          disabled={importingId === item.id}
                        >
                          {importingId === item.id
                            ? t('accessory_export_table.importing')
                            : t('accessory_export_table.import_back')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('accessory_export_table.confirm_title')}</DialogTitle>
                          <DialogDescription>
                            {t('accessory_export_table.confirm_message', {
                              name: item.accessoryName,
                              qty: item.quantity,
                            })}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedItem(null)}>
                            {t('accessory_export_table.cancel')}
                          </Button>
                          <Button onClick={handleImportConfirm} disabled={importingId === item.id}>
                            {importingId === item.id
                              ? t('accessory_export_table.importing')
                              : t('accessory_export_table.confirm')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
