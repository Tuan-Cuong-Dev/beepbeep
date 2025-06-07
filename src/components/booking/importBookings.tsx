'use client';

import { Timestamp } from 'firebase/firestore';
import { Booking } from '@/src/lib/booking/BookingTypes';
import * as XLSX from 'xlsx';

/**
 * Chuyển đổi dữ liệu từ Excel thành định dạng Booking (thiếu id, createdAt, updatedAt)
 */
function parseBookingFromRow(row: any): Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    if (!row['Full Name'] || !row['Phone Number'] || !row['Rental Start Date']) return null;

    const rentalStartDate = Timestamp.fromDate(new Date(row['Rental Start Date']));
    const rentalEndDate = row['Rental End Date']
      ? Timestamp.fromDate(new Date(row['Rental End Date']))
      : rentalStartDate;

    return {
      companyId: row['Company ID']?.toString() || '',
      stationId: row['Station ID']?.toString() || '',
      userId: row['User ID'] || undefined,

      idImage: row['ID Image'] || undefined,
      fullName: row['Full Name'] || '',
      channel: row['Channel'] || undefined,
      phone: row['Phone Number'] || '',
      idNumber: row['ID Number'] || '',
      address: row['Address'] || '',

      vehicleSearch: row['Vehicle Search'] || undefined,
      vehicleModel: row['Vehicle Model'] || '',
      vehicleColor: row['Vehicle Color'] || '',
      vin: row['VIN'] || '',
      licensePlate: row['License Plate'] || undefined,

      batteryCode1: row['Battery Code 1'] || undefined,
      batteryCode2: row['Battery Code 2'] || undefined,
      batteryCode3: row['Battery Code 3'] || undefined,
      batteryCode4: row['Battery Code 4'] || undefined,

      rentalStartDate,
      rentalStartHour: row['Rental Start Hour'] || '08:00',
      rentalDays: Number(row['Rental Days']) || 1,
      rentalEndDate,

      package: row['Package'] || undefined,
      basePrice: Number(row['Base Price']) || 0,
      batteryFee: row['Battery Fee'] ? Number(row['Battery Fee']) : undefined,
      totalAmount: Number(row['Total Amount']) || 0,
      deposit: Number(row['Deposit']) || 0,
      remainingBalance: Number(row['Remaining Balance']) || 0,

      deliveryMethod: row['Delivery Method'] === 'Deliver to Address' ? 'Deliver to Address' : 'Pickup at Shop',
      deliveryAddress: row['Delivery Address'] || undefined,

      helmet: row['Helmet'] === 'Yes',
      charger: row['Charger'] === 'Yes',
      phoneHolder: row['Phone Holder'] === 'Yes',
      rearRack: row['Rear Rack'] === 'Yes',
      raincoat: row['Raincoat'] === 'Yes',

      note: row['Note'] || undefined,

      bookingStatus: ['draft', 'confirmed', 'completed', 'cancelled'].includes((row['Booking Status'] || '').toLowerCase())
        ? row['Booking Status'].toLowerCase()
        : 'draft',
    } as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
  } catch (error) {
    console.error('Error parsing row:', error);
    return null;
  }
}

/**
 * Import từ file Excel, trả về danh sách Booking chưa có ID
 */
export async function importBookingsFromExcel(file: File): Promise<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const bookings: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const row of rows) {
    const parsed = parseBookingFromRow(row);
    if (parsed) bookings.push(parsed);
  }

  return bookings;
}
