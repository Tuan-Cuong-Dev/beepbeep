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
            placeholder="Search by package name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Durations</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import Excel
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
          <Button onClick={() => setOpenDialog('export')}>Export Excel</Button>
          <Button variant="destructive" onClick={() => setOpenDialog('delete')}>
            Delete All
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog !== null} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent>
          {openDialog === 'import' && (
            <>
              <DialogHeader>
                <DialogTitle>Import Confirmation</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to import packages from this file?</p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>Confirm Import</Button>
              </DialogFooter>
            </>
          )}
          {openDialog === 'export' && (
            <>
              <DialogHeader>
                <DialogTitle>Export Confirmation</DialogTitle>
              </DialogHeader>
              <p>
                You are about to export <strong>{packages.length}</strong> subscription packages.
              </p>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>Confirm Export</Button>
              </DialogFooter>
            </>
          )}
          {openDialog === 'delete' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600">Delete All Packages</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-2">
                Are you sure you want to permanently delete{' '}
                <strong>{packages.length}</strong> subscription packages?
                <br />
                This action <span className="text-red-600 font-semibold">cannot be undone</span>.
              </p>
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setOpenDialog(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete All'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
