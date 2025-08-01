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
  const { role } = useUser(); // 🔥 dùng trực tiếp từ AuthContext
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
        e.accessoryName?.toLowerCase().includes(searchName.toLowerCase()) &&
        e.target?.toLowerCase().includes(searchTarget.toLowerCase())
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
    <div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder={t('accessory_export_table.search_accessory')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          placeholder={t('accessory_export_table.search_target')}
          value={searchTarget}
          onChange={(e) => setSearchTarget(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
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
