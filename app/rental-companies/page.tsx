// Mình nên viết thêm Rental Company Page cho Admin để quản lý nhiều Company
// # Hiển thị tất cả companies (lọc được theo businessType)

"use client";

import { useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useRentalData, RentalCompany, RentalStation } from '@/src/hooks/useRentalData';
import RentalCompanyForm from '@/src/components/rental-management/rental-companies/CompanyForm';
import RentalStationForm from '@/src/components/rental-management/rental-stations/RentalStationForm';
import RentalSearchImportExport from '@/src/components/rental-management/rental-companies/RentalSearchImportExport';
import RentalTable from '@/src/components/rental-management/rental-companies/RentalTable';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function RentalCompaniesPage() {
  const { rentalCompanies, rentalStations, fetchCompanies, fetchStations } = useRentalData();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<RentalCompany | null>(null);
  const [editingStation, setEditingStation] = useState<RentalStation | null>(null);

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

  const confirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    setDialog({ open: true, type: 'confirm', title, description, onConfirm });
  };

  const handleSaveCompany = async (data: Omit<RentalCompany, 'id'>) => {
    try {
      if (editingCompany) {
        await updateDoc(doc(db, 'rentalCompanies', editingCompany.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog('success', '✅ Company updated successfully!');
      } else {
        await addDoc(collection(db, 'rentalCompanies'), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showDialog('success', '✅ Company added successfully!');
      }
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      console.error('❌ Error saving company:', err);
      showDialog('error', '❌ Failed to save company.');
    }
  };

  const handleDeleteCompany = (id: string) => {
    confirmDialog('Delete company?', 'Are you sure you want to delete this company?', async () => {
      try {
        await deleteDoc(doc(db, 'rentalCompanies', id));
        showDialog('success', '🗑️ Company deleted.');
        fetchCompanies();
      } catch (err) {
        console.error('❌ Error deleting company:', err);
        showDialog('error', '❌ Failed to delete company.');
      }
    });
  };

  const handleSaveStation = async (data: Omit<RentalStation, 'id'>) => {
    try {
      if (editingStation) {
        await updateDoc(doc(db, 'rentalStations', editingStation.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog('success', '✅ Station updated successfully!');
      } else {
        await addDoc(collection(db, 'rentalStations'), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showDialog('success', '✅ Station added successfully!');
      }
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      console.error('❌ Error saving station:', err);
      showDialog('error', '❌ Failed to save station.');
    }
  };

  const handleDeleteStation = (id: string) => {
    confirmDialog('Delete station?', 'Are you sure you want to delete this station?', async () => {
      try {
        await deleteDoc(doc(db, 'rentalStations', id));
        showDialog('success', '🗑️ Station deleted.');
        fetchStations();
      } catch (err) {
        console.error('❌ Error deleting station:', err);
        showDialog('error', '❌ Failed to delete station.');
      }
    });
  };

  const filteredCompanies = rentalCompanies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
          Rental Company Management
        </h1>

        <RentalSearchImportExport
          companies={rentalCompanies}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-2 hidden md:block">
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </h2>
            <RentalCompanyForm
              editingCompany={editingCompany}
              onSave={handleSaveCompany}
              onCancel={() => setEditingCompany(null)}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 hidden md:block">
              {editingStation ? 'Edit Station' : 'Add New Station'}
            </h2>
            <RentalStationForm
              companies={rentalCompanies.map((c) => ({ id: c.id, name: c.name }))}
              editingStation={editingStation}
              onSave={handleSaveStation}
              onCancel={() => setEditingStation(null)}
            />
          </div>
        </div>

        <RentalTable
          rentalCompanies={filteredCompanies}
          rentalStations={rentalStations}
          onEditCompany={(c) => setEditingCompany(c)}
          onDeleteCompany={handleDeleteCompany}
          onEditStation={(s) => setEditingStation(s)}
          onDeleteStation={handleDeleteStation}
        />
      </main>

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