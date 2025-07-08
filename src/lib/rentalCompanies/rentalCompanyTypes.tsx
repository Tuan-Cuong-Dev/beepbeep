// lib/rentalCompanies/rentalCompanyTypes.ts

import { Timestamp } from 'firebase/firestore';

export type BusinessType = 'rental_company' | 'private_provider';

export interface RentalCompany {
  id: string;
  name: string;
  email: string;
  phone: string;

  displayAddress: string;
  mapAddress: string;
  location: string; // dạng '16.071205° N, 108.223634° E'

  businessType: BusinessType;
  ownerId: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Company {
  id: string;
  name: string;
  [key: string]: any; // hoặc định nghĩa cụ thể nếu cần
}
