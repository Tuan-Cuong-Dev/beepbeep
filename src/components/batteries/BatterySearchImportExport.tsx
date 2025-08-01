'use client';

import { useEffect, useRef, useState } from 'react';
import { Battery } from '@/src/lib/batteries/batteryTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import * as XLSX from 'xlsx';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import PrintBatteryQRModal from '@/src/components/batteries/PrintBatteryQRModal';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Props {
  batteries: Battery[];
  setBatteries?: (batteries: Battery[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function BatterySearchImportExport({
  batteries,
  setBatteries,
  searchTerm,
  setSearchTerm,
}: Props) {
  const { user } = useUser();
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'info' | 'success' | 'error' | 'confirm',
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user?.uid) return;

      const staffQuery = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const staffSnap = await getDocs(staffQuery);
      if (!staffSnap.empty) {
        const staffDoc = staffSnap.docs[0].data();
        setCompanyId(staffDoc.companyId);
        return;
      }

      const companyQuery = query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid));
      const companySnap = await getDocs(companyQuery);
      if (!companySnap.empty) {
        const companyDoc = companySnap.docs[0].data();
        setCompanyId(companyDoc.id || companySnap.docs[0].id);
      }
    };

    fetchCompanyId();
  }, [user]);

  const showDialog = (
    type: 'info' | 'success' | 'error' | 'confirm',
    title: string,
    description?: string,
    onConfirm?: () => void
  ) => {
    setDialog({ open: true, type, title, description: description || '', onConfirm });
  };

  const handleExport = () => {
    const data = batteries.map((b) => ({
      'Company ID': b.companyId,
      'Battery Code': b.batteryCode,
      'Physical Code': b.physicalCode || '',
      'Import Date': b.importDate?.toDate?.().toISOString() || '',
      'Export Date': b.exportDate?.toDate?.().toISOString() || '',
      Status: b.status,
      Notes: b.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batteries');
    XLSX.writeFile(workbook, 'batteries.xlsx');

    showDialog('success', t('battery_search_import_export.export_success', { count: data.length }));
  };

  const handleImport = () => {
    if (!companyId) {
      showDialog('error', t('battery_search_import_export.missing_company_id'), t('battery_search_import_export.only_staff_or_owner'));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const importedBatteries: Battery[] = [];
        const imported = (json as any[]).map((row) => {
          const batteryRef = doc(collection(db, 'batteries'));
          const battery: Battery = {
            id: batteryRef.id,
            companyId: row['Company ID'] || companyId,
            batteryCode: String(row['Battery Code'] || ''),
            physicalCode: String(row['Physical Code'] || ''),
            importDate: row['Import Date']
              ? Timestamp.fromDate(new Date(row['Import Date']))
              : Timestamp.fromDate(new Date()),
            exportDate: row['Export Date']
              ? Timestamp.fromDate(new Date(row['Export Date']))
              : null,
            status: ((): Battery['status'] => {
              const s = String(row['Status'] || '').toLowerCase();
              if (s === 'in_use') return 'in_use';
              if (s === 'returned') return 'returned';
              if (s === 'maintenance') return 'maintenance';
              return 'in_stock';
            })(),
            notes: String(row['Notes'] || ''),
          };
          importedBatteries.push(battery);
          return { batteryRef, battery };
        }).filter(({ battery }) => battery.batteryCode.trim() !== '');

        await Promise.all(
          imported.map(({ batteryRef, battery }) => setDoc(batteryRef, battery))
        );

        if (setBatteries) {
          setBatteries(importedBatteries);
        }

        showDialog('success', t('battery_search_import_export.import_success', { count: importedBatteries.length }));
      } catch (error) {
        console.error('❌ Import failed:', error);
        showDialog('error', t('battery_search_import_export.import_failed'), t('battery_search_import_export.check_file_format'));
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDeleteAll = () => {
    showDialog('confirm', t('battery_search_import_export.confirm_delete_title'), t('battery_search_import_export.confirm_delete_message'), async () => {
      try {
        const snapshot = await getDocs(collection(db, 'batteries'));
        const deletePromises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, 'batteries', docSnap.id))
        );
        await Promise.all(deletePromises);
        if (setBatteries) {
          setBatteries([]);
        }
        showDialog('success', t('battery_search_import_export.all_deleted'));
      } catch (err) {
        console.error(err);
        showDialog('error', t('battery_search_import_export.delete_failed'));
      }
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4">
        <Input
          placeholder={t('battery_search_import_export.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />

        {setBatteries && (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleImport} className="w-full sm:w-auto">
              {t('battery_search_import_export.import')}
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button onClick={handleExport} className="w-full sm:w-auto">
              {t('battery_search_import_export.export')}
            </Button>
            <Button variant="default" onClick={() => setOpenPrintModal(true)} className="w-full sm:w-auto">
              {t('battery_search_import_export.print_qr')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} className="w-full sm:w-auto">
              {t('battery_search_import_export.delete_all')}
            </Button>
          </div>
        )}
      </div>

      <PrintBatteryQRModal
        open={openPrintModal}
        onClose={() => setOpenPrintModal(false)}
        batteries={batteries}
      />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </>
  );
}
