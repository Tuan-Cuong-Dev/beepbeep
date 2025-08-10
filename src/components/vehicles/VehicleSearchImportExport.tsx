'use client';

import { useState, useRef, useEffect } from 'react';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { exportvehiclesToExcel } from '@/src/lib/vehicles/exportVehicle';
import { importvehicles } from '@/src/lib/vehicles/importVehicle';
import { deleteAllvehiclesByCompany, deleteAllvehicles } from '@/src/lib/vehicles/deleteVehicleByCompany';
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
import ApplyModelPricingButton from '@/src/components/vehicles/ApplyModelPricingButton';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicles: Vehicle[];
  models: VehicleModel[];
  setVehicle: (vehicles: Vehicle[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  stationFilter: string;
  setStationFilter: (station: string) => void;
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
  companyMap: Record<string, string>;
  stations: RentalStation[];
  onPrintAll: () => void;
  companyId: string;
}

export default function VehicleSearchImportExport({
  vehicles = [],
  models,
  setVehicle,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stationFilter,
  setStationFilter,
  companyFilter,
  setCompanyFilter,
  companyMap = {},
  stations = [],
  onPrintAll,
  companyId,
}: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isAdmin = role === 'Admin';

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

      await importvehicles(importFile, models, setVehicle, companyId, stationMap);
      showNotify('success', t('vehicle_search_import_export.Import completed'), t('vehicle_search_import_export.Vehicles imported successfully.'));
      setImportFile(null);
    }
    setOpenImportDialog(false);
  };

  const handleExportConfirm = async () => {
    await exportvehiclesToExcel({ vehicles, models, stations, companyId });
    setOpenExportDialog(false);
    showNotify('success', t('vehicle_search_import_export.Exported'), `${vehicles.length} ${t('vehicle_search_import_export.vehicles exported')}`);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      let count = 0;
      if (isAdmin) {
        count = await deleteAllvehicles(role);
      } else {
        count = await deleteAllvehiclesByCompany(companyId, role);
      }
      setVehicle([]);
      showNotify('success', t('vehicle_search_import_export.Deleted All'), `${count} ${t('vehicle_search_import_export.vehicles deleted successfully')}`);
    } catch (error) {
      console.error(error);
      showNotify('error', t('vehicle_search_import_export.Delete Failed'), t('vehicle_search_import_export.An error occurred while deleting vehicles.'));
    } finally {
      setDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  // Ensure default empty arrays for vehicles, stations, and companyMap if undefined
  useEffect(() => {
    // Ensuring data is always available and handling the undefined case for arrays and objects
    if (!vehicles) setVehicle([]);
    if (!stations) stations = [];
    if (!companyMap) companyMap = {};
  }, [vehicles, stations, companyMap]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 mt-4">
        {isAdmin && (
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
          >
            <option value="">{t('vehicle_search_import_export.All Companies')}</option>
            {Object.entries(companyMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        >
          <option value="">{t('vehicle_search_import_export.All Stations')}</option>
          {stations.length > 0 &&
            stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </select>

        <input
          type="text"
          placeholder={t('vehicle_search_import_export.Search...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-[33.33%]"
        >
          <option value="All">{t('vehicle_search_import_export.All Status')}</option>
          <option value="Available">{t('vehicle_search_import_export.Available')}</option>
          <option value="In Use">{t('vehicle_search_import_export.In Use')}</option>
          <option value="Under Maintenance">{t('vehicle_search_import_export.Under Maintenance')}</option>
          <option value="Reserved">{t('vehicle_search_import_export.Reserved')}</option>
          <option value="Sold">{t('vehicle_search_import_export.Sold')}</option>
          <option value="Broken">{t('vehicle_search_import_export.Broken')}</option>
        </select>
      </div>

      {/* Actions */}
      <div className="hidden sm:flex grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto mb-4">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
          {t('vehicle_search_import_export.Import')}
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
          {t('vehicle_search_import_export.Export')}
        </Button>
        <Button variant="default" onClick={onPrintAll} className="w-full sm:w-auto">
          {t('vehicle_search_import_export.Print QR Labels')}
        </Button>
        <Button variant="danger" onClick={() => setOpenDeleteDialog(true)} className="w-full sm:w-auto">
          {t('vehicle_search_import_export.Delete All')}
        </Button>

        <ApplyModelPricingButton />
      </div>

      {/* Dialogs */}
      <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vehicle_search_import_export.Confirm Export')}</DialogTitle>
          </DialogHeader>
          <p>{t('vehicle_search_import_export.You are about to export')} <strong>{vehicles.length}</strong> {t('vehicle_search_import_export.vehicles')}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenExportDialog(false)}>{t('vehicle_search_import_export.Cancel')}</Button>
            <Button variant="default" onClick={handleExportConfirm}>{t('vehicle_search_import_export.Confirm Export')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openImportDialog} onOpenChange={setOpenImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vehicle_search_import_export.Confirm Import')}</DialogTitle>
          </DialogHeader>
          <p>{t('vehicle_search_import_export.Are you sure you want to import vehicles from the selected file?')}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenImportDialog(false)}>{t('vehicle_search_import_export.Cancel')}</Button>
            <Button variant="default" onClick={handleImportConfirm}>{t('vehicle_search_import_export.Confirm Import')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('vehicle_search_import_export.Confirm Deletion')}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('vehicle_search_import_export.Are you sure you want to permanently delete')} <strong>{vehicles.length}</strong> {t('vehicle_search_import_export.vehicles')}?
              <br />
              {t('vehicle_search_import_export.This action cannot be undone')}
            </p>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>{t('vehicle_search_import_export.Cancel')}</Button>
            <Button variant="danger" onClick={handleDeleteAll} disabled={deleting}>
              {deleting ? t('vehicle_search_import_export.Deleting...') : t('vehicle_search_import_export.Yes, Delete All')}
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
