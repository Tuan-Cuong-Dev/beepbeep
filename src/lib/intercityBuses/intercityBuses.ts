import { Timestamp } from 'firebase/firestore';

export interface IntercityBusOperator {
  id: string;
  ownerId: string;
  companyName: string;
  phone: string;
  email: string;
  licenseNo?: string;
  displayAddress: string;
  routes: string[]; // e.g., ["Hanoi - Da Nang", "HCMC - Can Tho"]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
