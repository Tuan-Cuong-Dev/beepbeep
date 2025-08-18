'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBookingData } from '@/src/hooks/useBookingData';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { Booking } from '@/src/lib/booking/BookingTypes';
import BookingForm from '@/src/components/booking/BookingForm';
import ResponsiveBookingTable from '@/src/components/booking/ResponsiveBookingTable';
import BookingSummaryCards from '@/src/components/booking/BookingSummaryCards';
import BookingSearchFilter from '@/src/components/booking/BookingSearchFilter';
import Pagination from '@/src/components/ui/pagination';
import { exportBookingsToExcel } from '@/src/components/booking/ExportBookings';
import { importBookingsFromExcel } from '@/src/components/booking/importBookings';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

type EntityType = 'rentalCompany' | 'privateProvider';

export default function BookingManagementPage() {
  const { t } = useTranslation('common', { keyPrefix: 'booking_management_page' });

  const { user, role, companyId, stationId } = useUser();
  const normalizedRole = role?.toLowerCase() ?? '';

  // Xác định entityType + ownerId (companyId hoặc providerId)
  const [entityType, setEntityType] = useState<EntityType>('rentalCompany');
  const [ownerId, setOwnerId] = useState<string>('');
  const [resolvingOwner, setResolvingOwner] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setResolvingOwner(true);
      try {
        if (normalizedRole === 'private_provider') {
          setEntityType('privateProvider');
          if (user?.uid) {
            const snap = await getDocs(
              query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
            );
            const providerId = snap.docs[0]?.id ?? '';
            if (mounted) setOwnerId(providerId);
          } else {
            if (mounted) setOwnerId('');
          }
        } else {
          setEntityType('rentalCompany');
          if (mounted) setOwnerId(companyId ?? '');
        }
      } finally {
        if (mounted) setResolvingOwner(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [normalizedRole, companyId, user?.uid]);

  // Lọc nâng cao
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string }>({});

  // Gọi hook mới (hook sẽ tự bỏ qua khi ownerId trống)
  const {
    bookings,
    stationNames,
    companyNames,
    packageNames,
    userNames,
    editingBooking,
    setEditingBooking,
    saveBooking,
    deleteBooking,
    loading,
  } = useBookingData(ownerId, entityType, filters);

  const pageSize = 20;

  const [notification, setNotification] = useState<{
    open: boolean;
    type: NotificationType;
    title: string;
    description?: string;
    onConfirm?: () => void;
  }>({
    open: false,
    type: 'info',
    title: '',
  });

  const filteredBookings = bookings.filter((b) => {
    // Hook đã lọc theo ownerId, nên chỉ cần siết thêm cho station_manager
    const matchesRole =
      normalizedRole === 'station_manager' && stationId
        ? b.stationId === stationId
        : true;

    const matchesSearch = searchText
      ? (b.fullName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (b.phone || '').includes(searchText) ||
        (b.vin || '').includes(searchText)
      : true;

    const matchesStatus =
      statusFilter === 'All' || (b.bookingStatus || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesRole && matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  const roleDisplayName: Record<string, string> = {
    admin: t('badge_roles.admin'),
    company_owner: t('badge_roles.company_owner'),
    private_provider: t('badge_roles.private_provider'),
    company_admin: t('badge_roles.company_admin'),
    station_manager: t('badge_roles.station_manager'),
  };

  const getBadgeColor = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'company_owner':
        return 'bg-green-100 text-green-800';
      case 'private_provider':
        return 'bg-blue-100 text-blue-800';
      case 'station_manager':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteBooking = (id: string) => {
    setNotification({
      open: true,
      type: 'confirm',
      title: t('notification.delete_confirm_title'),
      description: t('notification.delete_confirm_description'),
      onConfirm: () => {
        deleteBooking(id);
        setNotification({
          open: true,
          type: 'success',
          title: t('notification.delete_success'),
        });
      },
    });
  };

  const handleImportBookings = async (file: File) => {
    try {
      const importedBookings = await importBookingsFromExcel(file);
      for (const booking of importedBookings) {
        await saveBooking(booking as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setNotification({
        open: true,
        type: 'success',
        title: t('notification.import_success', { count: importedBookings.length }),
      });
    } catch {
      setNotification({
        open: true,
        type: 'error',
        title: t('notification.import_failed'),
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 space-y-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('title', { defaultValue: 'Quản lý đơn thuê xe' })}
          </h1>
          <Badge className={`text-sm px-3 py-1 rounded-full ${getBadgeColor(normalizedRole)}`}>
            {roleDisplayName[normalizedRole] || t('badge_roles.user', { defaultValue: 'Người dùng' })}
          </Badge>
        </div>

        {/* Thông báo chưa xác định owner cho private provider */}
        {resolvingOwner && <p>{t('loading')}</p>}
        {!resolvingOwner && !ownerId && (
          <p className="text-red-600">
            {t('no_owner_found', { defaultValue: 'Không xác định được đơn vị quản lý cho tài khoản hiện tại.' })}
          </p>
        )}

        <BookingSearchFilter
          onSearchChange={setSearchText}
          onStatusFilterChange={setStatusFilter}
          onDateRangeChange={(start, end) => setFilters({ startDate: start, endDate: end })}
        />

        <BookingSummaryCards bookings={filteredBookings} />

        <div className="flex gap-3 justify-end mb-4">
          <Button onClick={() => exportBookingsToExcel(filteredBookings)}>
            {t('export_button')}
          </Button>
          <input
            type="file"
            accept=".xlsx,.xls"
            id="importBookings"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportBookings(file);
            }}
          />
          <Button onClick={() => document.getElementById('importBookings')?.click()}>
            {t('import_button')}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">{t('table_title')}</h2>

            {loading ? (
              <p>{t('loading')}</p>
            ) : bookings.length > 0 ? (
              <ResponsiveBookingTable
                bookings={paginatedBookings}
                stationNames={stationNames}
                companyNames={companyNames}
                packageNames={packageNames}
                userNames={userNames}
                onEdit={(b) => setEditingBooking(b)}
                onDelete={(id) => handleDeleteBooking(id)}
              />
            ) : (
              <p className="text-gray-500 text-center">{t('no_bookings')}</p>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </main>

      <Footer />

      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
        <DialogContent className="!p-0 w-full max-w-none h-screen overflow-y-auto rounded-none bg-white">
          <DialogHeader className="bg-[#00d289] text-white px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              {editingBooking ? t('dialog.edit_title') : t('dialog.new_title')}
            </DialogTitle>
          </DialogHeader>

          {editingBooking && (
            <div className="p-6">
              <BookingForm
                editingBooking={editingBooking}
                companyNames={companyNames}
                userNames={userNames}
                packageNames={packageNames}
                packages={[]}
                ebikes={[]}
                onSave={async (data) => {
                  await saveBooking(data as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>);
                  setEditingBooking(null);
                }}
                onCancel={() => setEditingBooking(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NotificationDialog
        open={notification.open}
        type={notification.type}
        title={notification.title}
        description={notification.description}
        onClose={() => setNotification({ ...notification, open: false })}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
