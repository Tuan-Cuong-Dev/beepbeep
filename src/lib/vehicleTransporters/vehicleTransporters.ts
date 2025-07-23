import { Timestamp } from 'firebase/firestore';

export interface VehicleTransporter {
  id: string;
  ownerId: string;
  companyName: string;
  services: string[]; // ["pickup", "delivery", "rescue"]
  phone: string;
  email: string;
  website?: string;
  location?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
