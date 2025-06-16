import { Timestamp } from 'firebase/firestore';

export interface ErrorCode {
  id: string;
  code: string;
  description: string;
  recommendedSolution: string;
  brand?: string;        // đổi từ vehicleBrand
  modelName?: string;    // đổi từ modelId
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
