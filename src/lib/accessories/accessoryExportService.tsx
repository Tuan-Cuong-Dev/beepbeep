import {
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc, 
  query,
  where,
  collection,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { AccessoryExport } from './accessoryExportTypes';

/**
 * Tạo mới export và cập nhật tồn kho phụ kiện
 */
export async function exportAccessory(data: Omit<AccessoryExport, 'id'>) {
  let finalData: Omit<AccessoryExport, 'id'> = { ...data };

  // 👉 Nếu có accessoryId thì lấy thêm giá nhập và giá bán từ accessories
  if (data.accessoryId) {
    const accessoryRef = doc(db, 'accessories', data.accessoryId);
    const snap = await getDoc(accessoryRef);
    if (snap.exists()) {
      const accessory = snap.data();

      finalData = {
        ...finalData,
        importPrice: accessory.importPrice ?? undefined,
        retailPrice: accessory.retailPrice ?? undefined,
      };

      // 👉 Nếu là loại bulk và có quantity thì trừ số lượng
      if (accessory.type === 'bulk' && data.quantity) {
        const currentQty = accessory.quantity || 0;
        const newQty = Math.max(currentQty - data.quantity, 0);
        await updateDoc(accessoryRef, {
          quantity: newQty,
          updatedAt: Timestamp.now(),
        });
      }
    }
  }

  const docRef = await addDoc(collection(db, 'accessoryExports'), finalData);
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

/**
 * Xóa bản ghi xuất phụ kiện
 */
export async function deleteAccessoryExport(id: string): Promise<void> {
  const ref = doc(db, 'accessoryExports', id);
  await deleteDoc(ref);
}

/**
 * Nhập lại phụ kiện vào kho và xóa bản ghi xuất kho tương ứng
 */
export async function importBackAccessory(exportData: AccessoryExport): Promise<void> {
  const { accessoryId, quantity, id } = exportData;

  if (!accessoryId || !quantity || !id) return;

  // 1. Cộng lại số lượng vào phụ kiện gốc nếu là loại bulk
  const accessoryRef = doc(db, 'accessories', accessoryId);
  const snap = await getDoc(accessoryRef);

  if (snap.exists()) {
    const accessory = snap.data();
    if (accessory.type === 'bulk') {
      const currentQty = accessory.quantity || 0;
      await updateDoc(accessoryRef, {
        quantity: currentQty + quantity,
        updatedAt: Timestamp.now(),
      });
    }
  }

  // 2. Xóa bản ghi xuất kho
  await deleteDoc(doc(db, 'accessoryExports', id));
}
