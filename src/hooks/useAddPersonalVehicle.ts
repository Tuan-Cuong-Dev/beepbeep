// 📁 hooks/personalVehicles/useAddPersonalVehicle.ts
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { VehicleType } from '@/src/lib/vehicle-models/vehicleModelTypes';

/**
 * Hàm thêm xe cá nhân, tự động lấy hình mẫu từ vehicleModels
 */
export async function addPersonalVehicleWithModel({
  userId,
  modelId,
  name,
  vehicleType,
  brand,
  model,
  licensePlate,
  yearOfManufacture,
  odo,
  isPrimary = false,
}: {
  userId: string;
  modelId: string;
  name: string;
  vehicleType: VehicleType; // ✅ sửa lại đúng kiểu
  brand: string;
  model: string;
  licensePlate?: string;
  yearOfManufacture?: number;
  odo?: number;
  isPrimary?: boolean;
}) {
  // 🔍 Lấy hình mẫu từ vehicleModels
  let modelImageUrl = '';
  try {
    const modelDoc = await getDoc(doc(db, 'vehicleModels', modelId));
    if (modelDoc.exists()) {
      const data = modelDoc.data();
      modelImageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';
    }
  } catch (err) {
    console.warn('⚠️ Failed to load model image:', err);
  }

  // ✅ Dữ liệu xe cá nhân
  const newVehicle: Omit<PersonalVehicle_new, 'id'> = {
    userId,
    name,
    vehicleType,
    brand,
    model,
    licensePlate,
    yearOfManufacture,
    odo,
    photoUrl: '', // Chưa có ảnh thực tế
    modelImageUrl,
    isPrimary,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await addDoc(collection(db, 'personalVehicles'), newVehicle);
}
