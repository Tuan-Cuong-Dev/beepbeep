// Xữ lý roles cho collections là những staff của công ty/ trạm
// lib/auth/getUserRole.ts

import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Staff } from '../staff/staffTypes';

export const getUserRoleFromStaff = async (userId: string): Promise<Staff | null> => {
  try {
    const q = query(collection(db, 'staffs'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Staff;
  } catch (error) {
    console.error('Error fetching staff role:', error);
    return null;
  }
};

export interface UserAccess {
  companyId: string;
  stationId?: string;
  role: 'company_admin' | 'station_manager' | 'technician' | 'support';
}

export const getUserAccess = async (userId: string): Promise<UserAccess | null> => {
  const staff = await getUserRoleFromStaff(userId);
  if (!staff) return null;

  return {
    companyId: staff.companyId,
    stationId: staff.stationId,
    role: staff.role,
  };
};
