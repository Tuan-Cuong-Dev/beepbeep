'use client';

import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
  where,
  query,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import {
  Contribution,
  ContributionType,
} from '@/src/lib/contributions/contributionTypes';

export function useContributions() {
  const { user } = useUser();

  /**
   * Bảng điểm cho từng loại đóng góp
   */
  const pointByType: Record<ContributionType, number> = {
    rental_shop: 1,
    battery_station: 1,
    repair_shop: 1,
    map_location: 1,
    issue_proposal: 3,
    battery_charging_station: 0
  };

  /**
   * Gửi đóng góp của người dùng
   * @param type - Loại đóng góp (station, issue, proposal,...)
   * @param data - Dữ liệu liên quan (form đã gửi)
   * @param overridePoints - Nếu muốn ép điểm tùy ý
   */
  const submitContribution = async (
    type: ContributionType,
    data: any,
    overridePoints?: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    const points = overridePoints ?? pointByType[type] ?? 1;

    // ➕ Tạo document trong `contributions`
    await addDoc(collection(db, 'contributions'), {
      userId: user.uid,
      type,
      data,
      status: 'pending',
      pointsAwarded: points,
      createdAt: serverTimestamp(),
    });

    // ➕ Cộng điểm cho user trong `users`
    await updateDoc(doc(db, 'users', user.uid), {
      contributionPoints: increment(points),
      totalContributions: increment(1),
    });
  };

  /**
   * Lấy danh sách đóng góp của người dùng hiện tại
   */
  const getMyContributions = async (): Promise<Contribution[]> => {
    if (!user) return [];

    const q = query(
      collection(db, 'contributions'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Contribution),
    }));
  };

  return {
    submitContribution,
    getMyContributions,
  };
}
