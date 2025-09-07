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
  /** Tuỳ chọn: truyền để hiện nút Sửa/Xoá; nếu không truyền, bảng sẽ tự ẩn actions */
  onEdit?: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  /** Ép hiện/ẩn khu vực thao tác; mặc định: hiện nếu có onEdit hoặc onDelete */
  showActions?: boolean;
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
