'use client';

import { useState, useRef } from 'react';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';
import { EbikeModel } from '@/src/lib/ebikemodels/ebikeModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { exportEbikesToExcel } from '@/src/lib/ebikes/exportEbikes';
import { importEbikes } from '@/src/lib/ebikes/importEbikes';
import { deleteAllEbikesByCompany, deleteAllEbikes } from '@/src/lib/ebikes/deleteEbikesByCompany';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import ApplyModelPricingButton from '@/src/components/ebikes/ApplyModelPricingButton';

interface Props {
  ebikes: Ebike[];
  models: EbikeModel[];
  setEbikes: (ebikes: Ebike[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  stationFilter: string;
  setStationFilter: (station: string) => void;
  stations: RentalStation[];
  onPrintAll: () => void;
  companyId: string;
}

export default function EbikeSearchImportExport({
  ebikes,
  models,
  setEbikes,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stationFilter,
  setStationFilter,
  stations,
  onPrintAll,
  companyId,
}: Props) {
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const isCompanyOwner = role === 'company_owner';

  const [importFile, setImportFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notify, setNotify] = useState({ open: false, type: 'info', title: '', description: '' });
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotify = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setNotify({ open: true, type, title, description });
  };

  const handleImportConfirm = async () => {
    if (importFile) {
      const stationMap: Record<string, string> = {};
      stations.forEach((s) => {
        stationMap[s.id] = s.name;
      });

      await importEbikes(importFile, models, setEbikes, companyId, stationMap);
      showNotify('success', 'Import completed', 'eBikes imported successfully.');
      setImportFile(null);
    }
    setOpenImportDialog(false);
  };

  const handleExportConfirm = async () => {
    await exportEbikesToExcel({ ebikes, models, stations, companyId });
    setOpenExportDialog(false);
    showNotify('success', 'Exported', `${ebikes.length} eBikes exported.`);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    if (isAdmin) {
      await deleteAllEbikes();
    } else {
      await deleteAllEbikesByCompany(companyId);
    }
    setEbikes([]);
    setDeleting(false);
    setOpenDeleteDialog(false);
    showNotify('success', 'Deleted All', 'eBikes deleted successfully.');
  };

  return (
    <>
      {/* 🔍 Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 mt-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        >
          <option value="All">All Status</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Reserved">Reserved</option>
          <option value="Sold">Sold</option>
          <option value="Broken">Broken</option>
        </select>

        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        >
          <option value="">All Stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 🔘 Actions */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto mb-4">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
          Import
        </Button>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImportFile(file);
              setOpenImportDialog(true);
            }
          }}
          className="hidden"
        />
        <Button onClick={() => setOpenExportDialog(true)} className="w-full sm:w-auto">
          Export
        </Button>
        <Button variant="default" onClick={onPrintAll} className="w-full sm:w-auto">
          Print QR Labels
        </Button>
        <Button variant="danger" onClick={() => setOpenDeleteDialog(true)} className="w-full sm:w-auto">
          Delete All
        </Button>

        {/* ✅ NEW: Apply Pricing Button */}
        <ApplyModelPricingButton />
      </div>

      {/* Dialogs */}
      <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Confirmation</DialogTitle>
          </DialogHeader>
          <p>You are about to export <strong>{ebikes.length}</strong> ebikes.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenExportDialog(false)}>Cancel</Button>
            <Button variant="default" onClick={handleExportConfirm}>Confirm Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openImportDialog} onOpenChange={setOpenImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Confirmation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to import ebikes from the selected file?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenImportDialog(false)}>Cancel</Button>
            <Button variant="default" onClick={handleImportConfirm}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Deletion</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to permanently delete <strong>{ebikes.length}</strong> eBikes?
              <br />
              This action <span className="font-medium text-red-500">cannot be undone</span>.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAll} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationDialog
        open={notify.open}
        type={notify.type as 'success' | 'error' | 'info'}
        title={notify.title}
        description={notify.description}
        onClose={() => setNotify((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
