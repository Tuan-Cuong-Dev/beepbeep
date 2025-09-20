'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

type EntityType = 'rentalCompany' | 'privateProvider' | 'agent';

export default function BookingManagementPage() {
  const { t } = useTranslation('common', { keyPrefix: 'booking_management_page' });

  const { user, role, companyId, stationId } = useUser();
  const normalizedRole = (role || '').toLowerCase();
  const isAgent = normalizedRole === 'agent';
  const isAdmin = normalizedRole === 'admin';
  const canManage = !isAgent; // Agent chỉ xem, không thao tác

  // Xác định entityType + ownerId (companyId | providerId | agent userId | __ALL__ for admin)
  const [entityType, setEntityType] = useState<EntityType>('rentalCompany');
  const [ownerId, setOwnerId] = useState<string>('');
  const [resolvingOwner, setResolvingOwner] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const resolveOwner = async () => {
      setResolvingOwner(true);
      try {
        // Chưa đăng nhập → chờ đến khi có user
        if (!user?.uid) {
          if (mounted) {
            setEntityType('rentalCompany');
            setOwnerId('');
          }
          return;
        }

        // 1) Agent → entity=agent, ownerId = uid
        if (isAgent) {
          if (mounted) {
            setEntityType('agent');
            setOwnerId(user.uid);
          }
          return;
        }

        // 2) Private provider → tra theo ownerId
        if (normalizedRole === 'private_provider') {
          if (mounted) setEntityType('privateProvider');

          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          const providerId = snap.docs[0]?.id ?? '';
          if (mounted) setOwnerId(providerId); // rỗng → sẽ hiện thông báo
          return;
        }

        // 3) Mặc định rentalCompany
        if (mounted) setEntityType('rentalCompany');

        // 3a) Nếu context đã có companyId → dùng luôn
        if (companyId) {
          if (mounted) setOwnerId(companyId);
          return;
        }

        // 3b) Admin không có companyId → xem toàn hệ thống
        if (isAdmin) {
          if (mounted) setOwnerId('__ALL__');
          return;
        }

        // 3c) Company owner → tự tìm rentalCompany theo ownerId
        if (normalizedRole === 'company_owner') {
          const rcSnap = await getDocs(
            query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
          );
          const rcId = rcSnap.docs[0]?.id ?? '';
          if (mounted) setOwnerId(rcId);
          if (rcId) return;
        }

        // 3d) Nếu có stationId (ví dụ station_manager) → lấy companyId từ station
        if (stationId) {
          const stDoc = await getDoc(doc(db, 'rentalStations', stationId));
          const stData = stDoc.exists() ? stDoc.data() as any : null;
          const stCompanyId = stData?.companyId || '';
          if (mounted) setOwnerId(stCompanyId);
          if (stCompanyId) return;
        }

        // 3e) Các role staff khác → tìm trong collection 'staff' theo userId để lấy companyId
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('userId', '==', user.uid))
        );
        const staffCompanyId = staffSnap.docs[0]?.data()?.companyId || '';
        if (mounted) setOwnerId(staffCompanyId);

      } finally {
        if (mounted) setResolvingOwner(false);
      }
    };

    resolveOwner();
    return () => {
      mounted = false;
    };
  }, [normalizedRole, companyId, stationId, user?.uid, isAgent, isAdmin]);

  // Lọc nâng cao
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string }>({});

  // Công tắc “Chỉ đơn của tôi” (mặc định bật cho Agent)
  const [onlyMine, setOnlyMine] = useState<boolean>(isAgent);

  // Hook data
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
  } = useBookingData(ownerId, entityType, filters); // hook đã hỗ trợ ownerId='__ALL__'

  const pageSize = 20;

  const [notification, setNotification] = useState<{
    open: boolean;
    type: NotificationType;
    title: string;
    description?: string;
    onConfirm?: () => void;
  }>({ open: false, type: 'info', title: '' });

  // Lọc ở client (bổ sung điều kiện cho agent/onlyMine + station_manager)
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesAgentScope =
        isAgent && onlyMine ? (b as any)?.userId === user?.uid || (b as any)?.agentId === user?.uid : true;

      const matchesRole =
        normalizedRole === 'station_manager' && stationId
          ? (b as any)?.stationId === stationId
          : true;

      const matchesSearch = searchText
        ? ((b as any)?.fullName || '').toLowerCase().includes(searchText.toLowerCase()) ||
          ((b as any)?.phone || '').includes(searchText) ||
          ((b as any)?.vin || '').includes(searchText)
        : true;

      const bStatus = ((b as any)?.bookingStatus || '').toLowerCase();
      const matchesStatus =
        statusFilter === 'All' || bStatus === statusFilter.toLowerCase();

      return matchesAgentScope && matchesRole && matchesSearch && matchesStatus;
    });
  }, [bookings, isAgent, onlyMine, user?.uid, normalizedRole, stationId, searchText, statusFilter]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  const roleDisplayName: Record<string, string> = {
    admin: t('badge_roles.admin'),
    company_owner: t('badge_roles.company_owner'),
    private_provider: t('badge_roles.private_provider'),
    company_admin: t('badge_roles.company_admin'),
    station_manager: t('badge_roles.station_manager'),
    agent: t('badge_roles.agent', { defaultValue: 'Cộng tác viên' }),
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
      case 'agent':
        return 'bg-amber-100 text-amber-800';
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
        setNotification({ open: true, type: 'success', title: t('notification.delete_success') });
      },
    });
  };

  const handleImportBookings = async (file: File) => {
    try {
      const imported = await importBookingsFromExcel(file);
      for (const b of imported) {
        await saveBooking(b as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setNotification({
        open: true,
        type: 'success',
        title: t('notification.import_success', { count: imported.length }),
      });
    } catch {
      setNotification({ open: true, type: 'error', title: t('notification.import_failed') });
    }
  };

  const showNoOwner =
    !resolvingOwner &&
    !isAgent &&
    !(isAdmin && ownerId === '__ALL__') &&
    !ownerId;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 space-y-6 bg-gray-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">
            {t('title', { defaultValue: 'Quản lý đơn thuê xe' })}
          </h1>
          <div className="flex items-center gap-3">
            {isAgent && (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border"
                  checked={onlyMine}
                  onChange={(e) => setOnlyMine(e.target.checked)}
                />
                <span>{t('only_mine', { defaultValue: 'Chỉ đơn của tôi' })}</span>
              </label>
            )}
            <Badge className={`text-sm px-3 py-1 rounded-full ${getBadgeColor(normalizedRole)}`}>
              {roleDisplayName[normalizedRole] ||
                t('badge_roles.user', { defaultValue: 'Người dùng' })}
            </Badge>
          </div>
        </div>

        {resolvingOwner && <p>{t('loading')}</p>}
        {showNoOwner && (
          <p className="text-red-600">
            {t('no_owner_found', {
              defaultValue: 'Không xác định được đơn vị quản lý cho tài khoản hiện tại.',
            })}
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
          {!isAgent && (
            <>
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
            </>
          )}
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
                showActions={canManage}
                onEdit={canManage ? (b) => setEditingBooking(b) : undefined}
                onDelete={canManage ? (id) => handleDeleteBooking(id) : undefined}
              />
            ) : (
              <p className="text-gray-500 text-center">{t('no_bookings')}</p>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </main>

      <Footer />

      {canManage && (
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
                  vehicles={[]}
                  onSave={async (data) => {
                    await saveBooking(
                      data as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
                    );
                    setEditingBooking(null);
                  }}
                  onCancel={() => setEditingBooking(null)}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

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
