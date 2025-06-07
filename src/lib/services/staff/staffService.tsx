import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Staff } from '@/src/lib/staff/staffTypes';

const STAFF_COLLECTION = 'staffs';

export const getAllStaffs = async (companyId: string): Promise<Staff[]> => {
  try {
    const q = query(collection(db, STAFF_COLLECTION), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
  } catch (error) {
    console.error('🔥 getAllStaffs error:', error);
    throw error;
  }
};

export const getStaffById = async (id: string): Promise<Staff | null> => {
  try {
    const docRef = doc(db, STAFF_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Staff) : null;
  } catch (error) {
    console.error('🔥 getStaffById error:', error);
    throw error;
  }
};

export const createStaff = async (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> => {
  try {
    const newDoc = await addDoc(collection(db, STAFF_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: newDoc.id, ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as Staff;
  } catch (error) {
    console.error('🔥 createStaff error:', error);
    throw error;
  }
};

export const updateStaff = async (id: string, data: Partial<Staff>) => {
  try {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('🔥 updateStaff error:', error);
    throw error;
  }
};

export const deleteStaff = async (id: string) => {
  try {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('🔥 deleteStaff error:', error);
    throw error; // BẮT BUỘC PHẢI throw để phía useStaffData nhận được lỗi
  }
};
