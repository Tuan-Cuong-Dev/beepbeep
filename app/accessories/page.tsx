// 📄 AccessoryManagementPage.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  deleteDoc,
  doc,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import AccessoryForm from '@/src/components/accessories/AccessoryForm';
import AccessoryTable from '@/src/components/accessories/AccessoryTable';
import AccessorySearchImportExport from '@/src/components/accessories/AccessorySearchImportExport';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import { useAccessoryData } from '@/src/hooks/useAccessoryData';
import { Accessory } from '@/src/lib/accessories/accessoryTypes';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';

const emptyAccessory: Accessory = {
  id: '',
  companyId: '',
  name: '',
  type: 'tracked',
  code: '',
  quantity: undefined,
  status: 'in_stock',
  importDate: Timestamp.fromDate(new Date()),
  notes: '',
};

export default function AccessoryManagementPage() {
  const { user, role, companyId: contextCompanyId } = useUser();
  const isTechnician = role?.toLowerCase() === 'technician';
  const [companyId, setCompanyId] = useState<string | null>(contextCompanyId ?? null);
  const { accessories, setAccessories } = useAccessoryData();
  const [newAccessory, setNewAccessory] = useState<Accessory>({ ...emptyAccessory });
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (companyId && !isUpdateMode) {
      setNewAccessory((prev) => ({ ...prev, companyId }));
    }
  }, [companyId, isUpdateMode]);

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

  const filteredAccessories = accessories.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(term) ||
      (a.code?.toLowerCase().includes(term) ?? false);
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesCompany = companyId ? a.companyId === companyId : true;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const totalPages = Math.ceil(filteredAccessories.length / itemsPerPage);
  const paginatedAccessories = filteredAccessories.slice(
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
    const accessory = accessories.find((a) => a.id === id);
    if (!accessory) return;
    setDialog({
      open: true,
      type: 'confirm',
      title: `Delete accessory ${accessory.name}?`,
      description: 'This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'accessories', id));
          const updatedList = accessories.filter((a) => a.id !== id);
          setAccessories(updatedList);
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', 'Accessory deleted successfully');
        } catch (error) {
          console.error('Failed to delete accessory:', error);
          showDialog('error', 'Failed to delete accessory');
        }
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <div className="p-6">
        {isTechnician && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
            👀 You have <strong>view-only access</strong> as a Technician. You cannot add, edit, or delete accessories.
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-4 border-b pb-2">Accessory Management</h1>

        <AccessorySearchImportExport
          accessories={accessories}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          {...(!isTechnician && { setAccessories })}
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
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <AccessoryTable
          accessories={paginatedAccessories}
          onEdit={!isTechnician ? (item) => {
            setNewAccessory(item);
            setIsUpdateMode(true);
          } : undefined}
          onDelete={!isTechnician ? confirmDelete : undefined}
          onUpdateAccessory={!isTechnician ? (updated) => {
            setAccessories((prev) =>
              prev.map((item) =>
                item.id === updated.id ? updated : item
              )
            );
          } : undefined}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}

        {!isTechnician && (
          <AccessoryForm
            newAccessory={newAccessory}
            setNewAccessory={setNewAccessory}
            isUpdateMode={isUpdateMode}
            setIsUpdateMode={setIsUpdateMode}
            setAccessories={setAccessories}
            onNotify={(msg, type = 'success') => showDialog(type, msg)}
          />
        )}
      </div>

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
