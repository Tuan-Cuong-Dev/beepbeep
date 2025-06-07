'use client';
// Page chính thức của Booking

import { useState } from 'react';
import { useBookingData } from '@/src/hooks/useBookingData';
import { useUser } from '@/src/context/AuthContext';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { Booking } from '@/src/lib/booking/BookingTypes';
import BookingForm from '@/src/components/booking/BookingForm';
import BookingTable from '@/src/components/booking/BookingTable';
import BookingSummaryCards from '@/src/components/booking/BookingSummaryCards';
import BookingSearchFilter from '@/src/components/booking/BookingSearchFilter';
import Pagination from '@/src/components/ui/pagination';
import { exportBookingsToExcel } from '@/src/components/booking/ExportBookings';
import { importBookingsFromExcel } from '@/src/components/booking/importBookings';

import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function BookingManagementPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string }>({});

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
  } = useBookingData(filters);

  const { role, companyId, stationId } = useUser();
  const pageSize = 20;
  const normalizedRole = role?.toLowerCase() ?? '';

  const [notification, setNotification] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info' | 'confirm';
    title: string;
    description?: string;
    onConfirm?: () => void;
  }>({
    open: false,
    type: 'info',
    title: '',
  });

  const filteredBookings = bookings.filter((b) => {
    const matchesRole = (() => {
      if (normalizedRole === 'admin') return true;
      if (normalizedRole === 'company_owner' || normalizedRole === 'private_provider') return b.companyId === companyId;
      if (normalizedRole === 'station_manager') return b.stationId === stationId;
      return false;
    })();

    const matchesSearch = searchText
      ? b.fullName?.toLowerCase().includes(searchText.toLowerCase()) || b.phone?.includes(searchText) || b.vin?.includes(searchText)
      : true;

    const matchesStatus = statusFilter === 'All'
      ? true
      : b.bookingStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesRole && matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  const roleDisplayName: Record<string, string> = {
    admin: 'Admin - All Bookings',
    company_owner: 'Company Owner',
    private_provider: 'Private Provider',
    station_manager: 'Station Manager',
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
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
      title: 'Confirm Deletion',
      description: 'Are you sure you want to delete this booking? This action cannot be undone.',
      onConfirm: () => {
        deleteBooking(id);
        setNotification({
          open: true,
          type: 'success',
          title: 'Deleted successfully',
        });
      },
    });
  };

  const handleImportBookings = async (file: File) => {
    try {
      const importedBookings = await importBookingsFromExcel(file);
      for (const booking of importedBookings) {
        await saveBooking(booking);
      }
      setNotification({
        open: true,
        type: 'success',
        title: 'Import completed',
        description: `${importedBookings.length} bookings imported successfully.`,
      });
    } catch (_error) {
      setNotification({
        open: true,
        type: 'error',
        title: 'Import failed',
        description: 'An error occurred while importing bookings.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 space-y-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <Badge className={`text-sm px-3 py-1 rounded-full ${getBadgeColor(normalizedRole)}`}>
            {roleDisplayName[normalizedRole] || 'User'}
          </Badge>
        </div>

        <BookingSearchFilter
          onSearchChange={setSearchText}
          onStatusFilterChange={setStatusFilter}
          onDateRangeChange={(start, end) => {
            setFilters({ startDate: start, endDate: end });
          }}
        />

        <BookingSummaryCards bookings={filteredBookings} />

        <div className="flex gap-3 justify-end mb-4">
          <Button onClick={() => exportBookingsToExcel(filteredBookings)}>Export to Excel</Button>

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
            Import from Excel
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">Bookings List</h2>

            {loading ? (
              <p>Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <BookingTable
                bookings={paginatedBookings}
                stationNames={stationNames}
                companyNames={companyNames}
                packageNames={packageNames}
                userNames={userNames}
                onEdit={(b) => setEditingBooking(b)}
                onDelete={(id) => handleDeleteBooking(id)}
              />
            ) : (
              <p className="text-gray-500 text-center">No bookings found.</p>
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

      {/* Booking Form Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
        <DialogContent className="!p-0 w-full max-w-none h-screen overflow-y-auto rounded-none bg-white">
          <DialogHeader className="bg-[#00d289] text-white px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              {editingBooking ? 'Edit Booking' : 'New Booking'}
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
