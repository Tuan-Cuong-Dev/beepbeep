import { Timestamp } from 'firebase/firestore';

export interface TechnicianSuggestion {
  userId: string;
  name: string;
  comment: string;
  timestamp: Timestamp;
}

export interface ErrorCode {
  id: string;
  code: string;
  description: string;
  recommendedSolution: string;
  brand?: string;        // đổi từ vehicleBrand
  modelName?: string;    // đổi từ modelId
  createdBy: string;     // ID hoặc tên người tạo
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  /** 🔧 Link video hướng dẫn sửa lỗi (YouTube) */
  tutorialVideoUrl?: string;

  /** 💡 Góp ý từ kỹ thuật viên để cải tiến hướng xử lý */
  technicianSuggestions?: TechnicianSuggestion[];
}
