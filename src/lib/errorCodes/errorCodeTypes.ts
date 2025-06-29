import { Timestamp } from 'firebase/firestore';

export interface TechnicianSuggestion {
  userId: string;
  name: string;
  comment: string;
  timestamp: Timestamp;
}

/** 👨‍🔧 Kỹ thuật viên hỗ trợ sửa lỗi */
export interface TechnicianReference {
  name: string;
  phone: string;
  note?: string;
  userId?: string;       // optional – nếu sau này có tài khoản
  profileUrl?: string;   // optional – đường dẫn profile nếu đã có
}

export interface ErrorCode {
  id: string;
  code: string;
  description: string;
  recommendedSolution: string;
  brand?: string;       // e.g. Selex
  modelName?: string;   // e.g. Camel 2
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  /** 🔧 Link video hướng dẫn sửa lỗi (YouTube) */
  tutorialVideoUrl?: string;

  /** 💡 Góp ý từ kỹ thuật viên để cải tiến hướng xử lý */
  technicianSuggestions?: TechnicianSuggestion[];

  /** 👥 Các kỹ thuật viên có thể hỗ trợ xử lý lỗi này (dù có tài khoản hay chưa) */
  technicianReferences: { name?: string; phone?: string }[]; 
}
