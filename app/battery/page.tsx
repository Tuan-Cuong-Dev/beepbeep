// 📄 BatteryManagementPage.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { deleteDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import BatteryForm from '@/src/components/batteries/BatteryForm';
import ResponsiveBatteryTable from '@/src/components/batteries/ResponsiveBatteryTable';
import BatterySearchImportExport from '@/src/components/batteries/BatterySearchImportExport';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import BatterySummaryCard from '@/src/components/batteries/BatterySummaryCard';
import { Battery } from '@/src/lib/batteries/batteryTypes';
import { useBatteryData } from '@/src/hooks/useBatteryData';
import { Timestamp } from 'firebase/firestore';
import PrintBatteryQRModal from '@/src/components/batteries/PrintBatteryQRModal';
import { useUser } from '@/src/context/AuthContext';
import * as XLSX from 'xlsx';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { db } from '@/src/firebaseConfig';


const emptyBattery: Battery = {
  id: '',
  companyId: '',
  batteryCode: '',
  physicalCode: '',
  importDate: Timestamp.fromDate(new Date()),
  exportDate: undefined,
  status: 'in_stock',
  notes: '',
};

export default function BatteryManagementPage() {
  const { user, role, companyId: contextCompanyId } = useUser();
  const [companyId, setCompanyId] = useState<string | null>(contextCompanyId ?? null);
  const isTechnician = role?.toLowerCase() === 'technician';

  useEffect(() => {
    const fetchCompanyIdForOwner = async () => {
      if (role === 'company_owner' && !companyId && user?.uid) {
        const snapshot = await getDocs(
          query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
        );
        if (!snapshot.empty) {
          const fetchedId = snapshot.docs[0].id;
          setCompanyId(fetchedId);
        }
      }
    };
    fetchCompanyIdForOwner();
  }, [user?.uid, role, companyId]);

  const { batteries, setBatteries } = useBatteryData();
  const [newBattery, setNewBattery] = useState<Battery>({ ...emptyBattery });
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (companyId && !isUpdateMode) {
      setNewBattery((prev) => ({ ...prev, companyId }));
    }
  }, [companyId, isUpdateMode]);

  const filteredBatteries = batteries.filter((battery) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      battery.batteryCode.toLowerCase().includes(term) ||
      battery.physicalCode?.toLowerCase().includes(term) ||
      battery.status.toLowerCase().includes(term);
    const matchesStatus = statusFilter ? battery.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBatteries.length / itemsPerPage);
  const paginatedBatteries = filteredBatteries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });

  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    description = ''
  ) => {
    setDialog({ open: true, type, title, description, onConfirm: undefined });
  };

  const confirmDelete = (id: string) => {
    if (isTechnician) return;
    const battery = batteries.find((b) => b.id === id);
    if (!battery) return;
    setDialog({
      open: true,
      type: 'confirm',
      title: `Delete battery ${battery.batteryCode}?`,
      description: 'This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'batteries', id));
          const updatedList = batteries.filter((b) => b.id !== id);
          setBatteries(updatedList);
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', 'Battery deleted successfully');
        } catch (error) {
          console.error('Failed to delete battery:', error);
          showDialog('error', 'Failed to delete battery');
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <div className="p-6 mt-1">
        {isTechnician && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
            👀 You have <strong>view-only access</strong> as a Technician. You cannot add, edit, or delete batteries.
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-4 border-b-2 pb-2">Battery Management</h1>

        <BatterySummaryCard batteries={batteries} />

        <BatterySearchImportExport
          batteries={batteries}
          setBatteries={!isTechnician ? setBatteries : undefined} // ✅ tốt hơn
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />


        <div className="flex gap-4 items-center mb-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="in_use">In Use</option>
            <option value="returned">Returned</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <ResponsiveBatteryTable
          batteries={paginatedBatteries}
          setBatteries={!isTechnician ? setBatteries : undefined}
          onEdit={!isTechnician ? (battery) => {
            setNewBattery(battery);
            setIsUpdateMode(true);
          } : undefined}
          onDelete={!isTechnician ? confirmDelete : undefined}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}

        {!isTechnician && (
          <BatteryForm
            newBattery={newBattery}
            setNewBattery={setNewBattery}
            isUpdateMode={isUpdateMode}
            setIsUpdateMode={setIsUpdateMode}
            setBatteries={setBatteries}
            onNotify={(msg, type = 'success') => showDialog(type, msg)}
          />
        )}
      </div>

      <PrintBatteryQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        batteries={batteries}
      />

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
