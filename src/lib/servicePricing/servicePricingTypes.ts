// 📄 lib/servicePricing/servicePricingTypes.ts
import { Timestamp } from 'firebase/firestore';

export interface ServicePricing {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: number;
  currency: 'VND';
  imageUrl?: string;
  createdBy: string;
  createdAt: Timestamp;
}
