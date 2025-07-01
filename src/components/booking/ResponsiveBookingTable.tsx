'use client';

import BookingTable from './BookingTable';
import BookingTableMobile from './BookingTableMobile';
import { Booking } from '@/src/lib/booking/BookingTypes';

interface Props {
  bookings: Booking[];
  stationNames: Record<string, string>;
  companyNames: Record<string, string>;
  packageNames: Record<string, string>;
  userNames: Record<string, string>;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export default function ResponsiveBookingTable(props: Props) {
  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block">
        <BookingTable {...props} />
      </div>

      {/* Mobile version */}
      <div className="block md:hidden">
        <BookingTableMobile {...props} />
      </div>
    </>
  );
}
