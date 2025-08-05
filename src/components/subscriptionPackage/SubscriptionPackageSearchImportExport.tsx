'use client';

import { useState, useRef } from 'react';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { importSubscriptionPackagesFromExcel } from '@/src/lib/subscriptionPackages/importSubscriptionPackages';
import { exportSubscriptionPackagesToExcel } from '@/src/lib/subscriptionPackages/exportSubscriptionPackages';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface Props {
  packages: SubscriptionPackage[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  durationFilter: string;
  setDurationFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onExport: () => void;
  onImportComplete: (
    imported: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  companyId: string;
}

export default function SubscriptionPackageSearchImportExport({
  packages,
  searchTerm,
  setSearchTerm,
  durationFilter,
  setDurationFilter,
  statusFilter,
  setStatusFilter,
  onExport,
  onImportComplete,
  onDeleteAll,
  companyId,
}: Props) {
  const { t } = useTranslation('common');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openDialog, setOpenDialog] = useState<'import' | 'export' | 'delete' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async () => {
    if (!importFile || !companyId) {
      setOpenDialog(null);
      return;
    }
    try {
      const data = await importSubscriptionPackagesFromExcel(importFile, companyId);
      await onImportComplete(data);
    } catch (error) {
      console.error('❌ Import failed:', error);
    } finally {
      setImportFile(null);
      setOpenDialog(null);
    }
  };

  const handleExport = async () => {
    await exportSubscriptionPackagesToExcel(packages);
    setOpenDialog(null);
    onExport();
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      await onDeleteAll();
    } catch (error) {
      console.error('❌ Delete failed:', error);
    } finally {
      setDeleting(false);
      setOpenDialog(null);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4 mt-4">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder={t('subscription_package_search_import_export.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">{t('subscription_package_search_import_export.all_durations')}</option>
            <option value="daily">{t('subscription_package_search_import_export.daily')}</option>
            <option value="monthly">{t('subscription_package_search_import_export.monthly')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">{t('subscription_package_search_import_export.all_status')}</option>
            <option value="available">{t('subscription_package_search_import_export.available')}</option>
            <option value="inactive">{t('subscription_package_search_import_export.inactive')}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            {t('subscription_package_search_import_export.import_excel')}
          </Button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImportFile(file);
                setOpenDialog('import');
              }
            }}
            className="hidden"
          />
          <Button onClick={() => setOpenDialog('export')}>
            {t('subscription_package_search_import_export.export_excel')}
          </Button>
          <Button variant="destructive" onClick={() => setOpenDialog('delete')}>
            {t('subscription_package_search_import_export.delete_all')}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog !== null} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          {openDialog === 'import' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('subscription_package_search_import_export.import_title')}</DialogTitle>
              </DialogHeader>
              <p>{t('subscription_package_search_import_export.import_message')}</p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  {t('subscription_package_search_import_export.cancel')}
                </Button>
                <Button onClick={handleImport}>
                  {t('subscription_package_search_import_export.confirm_import')}
                </Button>
              </DialogFooter>
            </>
          )}
          {openDialog === 'export' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('subscription_package_search_import_export.export_title')}</DialogTitle>
              </DialogHeader>
              <p>
                {t('subscription_package_search_import_export.export_message', {
                  count: packages.length,
                })}
              </p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  {t('subscription_package_search_import_export.cancel')}
                </Button>
                <Button onClick={handleExport}>
                  {t('subscription_package_search_import_export.confirm_export')}
                </Button>
              </DialogFooter>
            </>
          )}
          {openDialog === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  {t('subscription_package_search_import_export.delete_title')}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-2">
                {t('subscription_package_search_import_export.delete_message', {
                  count: packages.length,
                })}
              </p>
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  {t('subscription_package_search_import_export.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                >
                  {deleting
                    ? t('subscription_package_search_import_export.deleting')
                    : t('subscription_package_search_import_export.confirm_delete')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
