import { Timestamp } from 'firebase/firestore';

export interface PublicIssue {
  id?: string;
  customerName: string;
  phone: string;
  issueDescription: string;
  vehicleId?: string;
  reportedBy?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  location: {
    mapAddress: string;
    coordinates?: string;
    issueAddress?: string;
  };
}