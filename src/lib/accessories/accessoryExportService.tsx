// 📁 lib/accessories/accessoryExportService.ts
import {
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  collection,
  doc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { AccessoryExport } from './accessoryExportTypes';

/**
 * Tạo mới export và cập nhật tồn kho phụ kiện
 */
export async function exportAccessory(data: Omit<AccessoryExport, 'id'>) {
  const docRef = await addDoc(collection(db, 'accessoryExports'), data);

  // Nếu có mã phụ kiện (tracked), thì trừ số lượng
  if (data.accessoryId && data.quantity) {
    const accessoryRef = doc(db, 'accessories', data.accessoryId);
    const accessorySnap = await getDoc(accessoryRef);

    if (accessorySnap.exists()) {
      const current = accessorySnap.data();
      const currentQty = current.quantity || 0;
      const newQty = Math.max(currentQty - data.quantity, 0); // không cho nhỏ hơn 0

      await updateDoc(accessoryRef, {
        quantity: newQty,
        updatedAt: new Date(),
      });
    }
  }

  return docRef.id;
}

/**
 * Lấy tất cả danh sách xuất phụ kiện theo companyId
 */
export async function getAccessoryExports(companyId?: string): Promise<AccessoryExport[]> {
  const q = companyId
    ? query(collection(db, 'accessoryExports'), where('companyId', '==', companyId))
    : collection(db, 'accessoryExports'); // admin: không lọc

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AccessoryExport[];
}
