// Đây là sản phẩm bảo hiểm ADMIN tạo ra theo từng giai đoạn của dự án.
// Cái này có thể hợp tác với các bên bảo hiểm để làm

export interface InsuranceProduct {
  id: string;
  name: string; // e.g. "BIP365 Plus"
  description: string;
  coverageDetails: string; // e.g. "Covers fire, theft, damage..."
  features: string[]; // 🔹 e.g. ["24/7 roadside assistance", "Full vehicle replacement"]
  durationInDays: number;
  price: number; // VND
  imageUrl?: string;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
