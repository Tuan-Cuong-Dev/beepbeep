// customerType.ts

import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Timestamp | null;
  driverLicense: string;
  idNumber: string;
  nationality?: string;         // Quốc tịch
  sex?: string;                 // Giới tính
  placeOfOrigin?: string;       // Quê quán
  placeOfResidence?: string;    // Nơi thường trú
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}
