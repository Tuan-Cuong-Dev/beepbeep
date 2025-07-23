import { Timestamp } from 'firebase/firestore';

export interface TourGuide {
  id: string;
  ownerId: string;
  name: string;
  languages: string[]; // e.g., ["en", "vi", "ja"]
  phone: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  routes?: string[]; // optional
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
