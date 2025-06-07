'use client';
// Xuất dữ liệu bookings ra file Excel
import { Booking } from '@/src/lib/booking/BookingTypes';
import * as XLSX from 'xlsx';

function formatDate(date?: any) {
  if (!date?.toDate) return '';
  const d = date.toDate();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateTime(date?: any) {
  if (!date?.toDate) return '';
  return date.toDate().toLocaleString();
}

function formatBoolean(value?: boolean) {
  return value ? 'Yes' : 'No';
}

export function exportBookingsToExcel(bookings: Booking[]) {
  const data = bookings.map((b) => ({
    'Company ID': b.companyId,
    'Station ID': b.stationId,
    'User ID': b.userId || '',

    'Full Name': b.fullName,
    'Phone Number': b.phone,
    'ID Number': b.idNumber,
    'Address': b.address,
    'Channel': b.channel || '',

    'Vehicle Model': b.vehicleModel,
    'Vehicle Color': b.vehicleColor,
    'VIN': b.vin,
    'License Plate': b.licensePlate || '',

    'Battery Code 1': b.batteryCode1 || '',
    'Battery Code 2': b.batteryCode2 || '',
    'Battery Code 3': b.batteryCode3 || '',
    'Battery Code 4': b.batteryCode4 || '',

    'Rental Start Date': formatDate(b.rentalStartDate),
    'Rental Start Hour': b.rentalStartHour,
    'Rental Days': b.rentalDays,
    'Rental End Date': formatDate(b.rentalEndDate),

    'Package': b.package || '',
    'Base Price': b.basePrice,
    'Battery Fee': b.batteryFee || '',
    'Total Amount': b.totalAmount,
    'Deposit': b.deposit,
    'Remaining Balance': b.remainingBalance,

    'Delivery Method': b.deliveryMethod,
    'Delivery Address': b.deliveryAddress || '',

    'Helmet': formatBoolean(b.helmet),
    'Charger': formatBoolean(b.charger),
    'Phone Holder': formatBoolean(b.phoneHolder),
    'Rear Rack': formatBoolean(b.rearRack),
    'Raincoat': formatBoolean(b.raincoat),

    'Note': b.note || '',

    'Booking Status (draft/confirmed/completed/cancelled)': b.bookingStatus,
    'Created At': formatDateTime(b.createdAt),
    'Updated At': formatDateTime(b.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

  XLSX.writeFile(workbook, `bookings_${new Date().getTime()}.xlsx`);
}
