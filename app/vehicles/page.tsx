'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import VehicleForm from '@/src/components/vehicles/VehicleForm';
import VehicleTable from '@/src/components/vehicles/VehicleTable';
import VehicleSearchImportExport from '@/src/components/vehicles/VehicleSearchImportExport';
import PrintQRModal from '@/src/components/vehicles/PrintQRModal';
import VehicleSummaryCard from '@/src/components/vehicles/VehicleSummaryCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { deleteDoc, doc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { useVehicleData } from '@/src/hooks/useVehicleData';
import { useVehicleModel } from '@/src/hooks/useVehicleModel';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { useCurrentCompanyId } from '@/src/hooks/useCurrentCompanyId'; // ✅ thêm vào
import { db } from '@/src/firebaseConfig';
import { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';

const emptyVehicle: Vehicle = {
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

export default function VehicleManagementPage() {
  const { t } = useTranslation('common');
  const { role, loading: userLoading, stationId } = useUser();
  const { companyId, loading: companyLoading } = useCurrentCompanyId(); // ✅ dùng hook mới

  const isAdmin = role?.toLowerCase() === 'admin';
  const isCompanyOwner = role === 'company_owner';
  const isDataGateOpen = isAdmin || !!companyId;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});
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
    Vehicles,
    setVehicles,
    VehicleModels,
    setVehicleModels,
  } = useVehicleData({ companyId: companyId || '' });

  const VehicleModelForm = useVehicleModel({
    companyId: companyId ?? undefined,
    isAdmin,
    onSaveComplete: () => {
      showDialog('success', t('vehicle_management_page.model_saved'));
      VehicleModelForm.fetchModels();
    },
  });

  const { stations, loading: stationsLoading } = useRentalStations(companyId || '', isAdmin);

  const [newVehicle, setNewVehicle] = useState<Vehicle | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  useEffect(() => {
    if (isDataGateOpen) {
      setNewVehicle({
        ...emptyVehicle,
        companyId: companyId || '',
        stationId: stationId || '',
      });
    }
  }, [companyId, stationId, isDataGateOpen]);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAdmin) return;
      const snapshot = await getDocs(collection(db, 'rentalCompanies'));
      const map: Record<string, string> = {};
      snapshot.forEach((d) => {
        const data = d.data() as RentalCompany;
        map[d.id] = data.name;
      });
      setCompanyMap(map);
    };
    fetchCompanies();
  }, [isAdmin]);

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description, onConfirm: undefined });
  };

  const handleVehicleSaved = () => {
    showDialog(
      'success',
      isUpdateMode ? t('vehicle_management_page.vehicle_updated') : t('vehicle_management_page.vehicle_added')
    );
    setIsUpdateMode(false);
  };

  const handleVehicleEdit = (vehicle: Vehicle) => {
    const safeVehicle: Vehicle = {
      ...vehicle,
      lastMaintained:
        vehicle.lastMaintained instanceof Timestamp
          ? vehicle.lastMaintained
          : Timestamp.fromDate(new Date()),
    };
    setNewVehicle(safeVehicle);
    setIsUpdateMode(true);
  };

  const handleConfirmDelete = (vehicle: Vehicle) => {
    setDialog({
      open: true,
      type: 'confirm',
      title: t('vehicle_management_page.confirm_delete_title'),
      description: t('vehicle_management_page.confirm_delete_description', {
        serialNumber: vehicle.serialNumber,
      }),
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'vehicles', vehicle.id));
          setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
          setDialog((prev) => ({ ...prev, open: false }));
          showDialog('success', t('vehicle_management_page.delete_success'));
        } catch (err) {
          console.error('❌ Failed to delete Vehicle:', err);
          showDialog('error', t('vehicle_management_page.delete_failed'));
        }
      },
    });
  };

  const filteredVehicles = Vehicles.filter((bike) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      bike.serialNumber?.toLowerCase().includes(term) ||
      bike.vehicleID?.toLowerCase().includes(term) ||
      bike.plateNumber?.toLowerCase().includes(term) ||
      bike.status?.toLowerCase().includes(term) ||
      bike.currentLocation?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' ? true : bike.status === statusFilter;
    const matchesStation = stationFilter === '' ? true : bike.stationId === stationFilter;
    const matchesCompany = isAdmin ? (companyFilter === '' || bike.companyId === companyFilter) : true;

    return matchesSearch && matchesStatus && matchesStation && matchesCompany;
  });

  const totalPages = Math.ceil(filteredVehicles.length / pageSize);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const VehicleStatusCount: Record<string, number> = {};
  Vehicles.forEach((bike) => {
    VehicleStatusCount[bike.status] = (VehicleStatusCount[bike.status] || 0) + 1;
  });

  const totalVehicleCount = Vehicles.length;

  /* ============ LOADING ============ */
  if (userLoading || companyLoading || (isDataGateOpen && stationsLoading)) {
    return (
      <div className="flex justify-center items-center h-screen">
        {t('vehicle_management_page.loading')}
      </div>
    );
  }

  /* ============ NO COMPANY (non-admin) ============ */
  if (!isDataGateOpen) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <UserTopMenu />
        <main className="p-6 mt-1 flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <h1 className="text-xl font-semibold">{t('vehicle_management_page.title')}</h1>
            <p className="text-red-600">{t('station_management_page.no_company')}</p>
            <a href="/my-business" className="underline">
              {t('station_management_page.create_or_join_company')}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ============ MAIN UI ============ */
  if (!newVehicle) {
    return (
      <div className="flex justify-center items-center h-screen">
        {t('vehicle_management_page.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="p-6 mt-1 flex-grow">
        <h1 className="text-2xl font-semibold mb-4 border-b-2 pb-2">
          {t('vehicle_management_page.title')}
        </h1>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4 mb-6">
          <VehicleSummaryCard
            status="Total"
            title={t('vehicle_management_page.total')}
            count={totalVehicleCount}
            total={totalVehicleCount}
          />
          {Object.entries(VehicleStatusCount).map(([statusKey, count]) => (
            <VehicleSummaryCard
              key={statusKey}
              status={statusKey}
              title={t(`vehicle_status.${statusKey}`)}
              count={count}
              total={totalVehicleCount}
            />
          ))}
        </div>

        <VehicleSearchImportExport
          vehicles={Vehicles}
          models={VehicleModels}
          setVehicle={setVehicles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
          stations={stations}
          onPrintAll={() => setQrModalOpen(true)}
          companyId={companyId || ''}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          companyMap={companyMap}
        />

        <VehicleTable
          vehicles={paginatedVehicles}
          models={VehicleModels}
          stations={stations}
          setvehicles={setVehicles}
          onEdit={handleVehicleEdit}
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

        <VehicleForm
          companyId={companyId || ''}
          newVehicle={newVehicle}
          setNewVehicle={setNewVehicle}
          models={VehicleModels}
          stations={stations}
          isUpdateMode={isUpdateMode}
          setIsUpdateMode={setIsUpdateMode}
          setVehicles={setVehicles}
          onSaveComplete={handleVehicleSaved}
          showStationSelect={isCompanyOwner}
        />
      </main>

      <PrintQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        vehicles={Vehicles}
        models={VehicleModels}
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
