'use client';

import { useState, useEffect } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import EbikeModelForm from '@/src/components/ebikeModels/EbikeModelForm';
import EbikeModelTable from '@/src/components/ebikeModels/EbikeModelTable';
import EbikeForm from '@/src/components/ebikes/EbikeForm';
import EbikeTable from '@/src/components/ebikes/EbikeTable';
import EbikeSearchImportExport from '@/src/lib/ebikes/ebikeSearchImportExport';
import PrintQRModal from '@/src/components/ebikes/PrintQRModal';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import EbikeSummaryCard from '@/src/components/ebikes/EbikeSummaryCard';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';
import { deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { useEbikeData } from '@/src/hooks/useEbikeData';
import { useEbikeModelForm } from '@/src/hooks/useEbikeModel';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { db } from '@/src/firebaseConfig';

const emptyEbike: Ebike = {
  id: '',
  modelId: '',
  serialNumber: '',
  vehicleID: '',
  plateNumber: '',
  odo: 0,
  color: '',
  status: 'Available',
  currentLocation: '',
  lastMaintained: Timestamp.fromDate(new Date()),
  batteryCapacity: '',
  range: 0,
  pricePerDay: 0,
  companyId: '',
  stationId: '',
};

export default function EbikeManagementPage() {
  const { companyId, stationId, role, loading: userLoading } = useUser();
  const isAdmin = role?.toLowerCase() === 'admin';
  const isCompanyOwner = role === 'company_owner';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info' | 'confirm',
    title: '',
    description: '',
    onConfirm: undefined as (() => void) | undefined,
  });

  const {
    ebikes,
    setEbikes,
    ebikeModels,
    setEbikeModels,
  } = useEbikeData({ companyId: companyId || '', isAdmin });

  const ebikeModelForm = useEbikeModelForm({
    companyId: companyId ?? undefined,
    isAdmin,
    onSaveComplete: () => {
      showDialog('success', 'Ebike model saved!');
      ebikeModelForm.fetchModels();
    },
  });

  const { stations, loading: stationsLoading } = useRentalStations(companyId || '', isAdmin);
  const [newEbike, setNewEbike] = useState<Ebike | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [modelPage, setModelPage] = useState(1);
  const modelPageSize = 5;

  useEffect(() => {
    console.log('🧾 companyId:', companyId);
    if (companyId || isAdmin) {
      setNewEbike({ ...emptyEbike, companyId: companyId || '', stationId: stationId || '' });
    }
  }, [companyId, stationId, isAdmin]);

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description, onConfirm: undefined });
  };

  const handleEbikeSaved = () => {
    showDialog('success', isUpdateMode ? 'Vehicle updated!' : 'Vehicle added!');
    setIsUpdateMode(false);
  };

  const handleEbikeEdit = (bike: Ebike) => {
    const safeBike = {
      ...bike,
      lastMaintained:
        bike.lastMaintained instanceof Timestamp
          ? bike.lastMaintained
          : Timestamp.fromDate(new Date()),
    };
    setNewEbike(safeBike);
    setIsUpdateMode(true);
  };

  const handleConfirmDelete = (bike: Ebike) => {
    setDialog({
      open: true,
      type: 'confirm',
      title: 'Confirm Delete',
      description: `Are you sure you want to delete "${bike.serialNumber}"?`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'ebikes', bike.id));
          setEbikes((prev) => prev.filter((b) => b.id !== bike.id));
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', 'Ebike deleted successfully!');
        } catch (err) {
          console.error('❌ Failed to delete ebike:', err);
          showDialog('error', 'Failed to delete ebike.');
        }
      },
    });
  };

  const filteredEbikes = ebikes.filter((bike) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      bike.serialNumber?.toLowerCase().includes(term) ||
      bike.vehicleID?.toLowerCase().includes(term) ||
      bike.plateNumber?.toLowerCase().includes(term) ||
      bike.status?.toLowerCase().includes(term) ||
      bike.currentLocation?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' ? true : bike.status === statusFilter;
    const matchesStation = stationFilter === '' ? true : bike.stationId === stationFilter;
    return matchesSearch && matchesStatus && matchesStation;
  });

  const totalPages = Math.ceil(filteredEbikes.length / pageSize);
  const paginatedEbikes = filteredEbikes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalModelPages = Math.ceil(ebikeModelForm.models.length / modelPageSize);
  const paginatedModels = ebikeModelForm.models.slice(
    (modelPage - 1) * modelPageSize,
    modelPage * modelPageSize
  );

  const ebikeStatusCount: Record<string, number> = {};
  ebikes.forEach((bike) => {
    ebikeStatusCount[bike.status] = (ebikeStatusCount[bike.status] || 0) + 1;
  });

  const totalEbikeCount = ebikes.length;

  if (userLoading || stationsLoading || (!companyId && !isAdmin) || !newEbike) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="p-6 mt-1 flex-grow">
        <h1 className="text-2xl font-semibold mb-4 border-b-2 pb-2">Vehicle Management</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <EbikeSummaryCard status="Total" count={totalEbikeCount} total={totalEbikeCount} />
          {Object.entries(ebikeStatusCount).map(([status, count]) => (
            <EbikeSummaryCard key={status} status={status} count={count} total={totalEbikeCount} />
          ))}
        </div>

        <EbikeSearchImportExport
          ebikes={ebikes}
          models={ebikeModels}
          setEbikes={setEbikes}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
          stations={stations}
          onPrintAll={() => setQrModalOpen(true)}
          companyId={companyId || ''}
        />



        <EbikeTable
          ebikes={paginatedEbikes}
          models={ebikeModels}
          stations={stations}
          setEbikes={setEbikes}
          onEdit={handleEbikeEdit}
          onDeleteConfirm={handleConfirmDelete}
          companyId={companyId || ''}
          showStationColumn={isCompanyOwner}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        <EbikeForm
          companyId={companyId || ''}
          newEbike={newEbike}
          setNewEbike={setNewEbike}
          models={ebikeModels}
          stations={stations}
          isUpdateMode={isUpdateMode}
          setIsUpdateMode={setIsUpdateMode}
          setEbikes={setEbikes}
          onSaveComplete={handleEbikeSaved}
          showStationSelect={isCompanyOwner}
        />

        <EbikeModelTable
          companyId={companyId || ''}
          models={paginatedModels}
          onReload={ebikeModelForm.fetchModels}
          onEdit={ebikeModelForm.setEditModel}
          reloadTrigger={false}
        />

        {totalModelPages > 1 && (
          <Pagination
            currentPage={modelPage}
            totalPages={totalModelPages}
            onPageChange={setModelPage}
          />
        )}

        <EbikeModelForm
          companyId={companyId ?? ''}
          newEbikeModel={ebikeModelForm.newEbikeModel}
          handleChange={ebikeModelForm.handleChange}
          handleSave={ebikeModelForm.handleSave}
          isUpdateModeModel={ebikeModelForm.isUpdateModeModel}
          loading={ebikeModelForm.loading}
        />
      </main>

      <PrintQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ebikes={ebikes}
        models={ebikeModels}
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