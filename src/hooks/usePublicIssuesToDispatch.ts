// 📁 hooks/usePublicIssuesToDispatch.ts
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

export function usePublicIssuesToDispatch() {
  const [issues, setIssues] = useState<PublicVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [partnerMap, setPartnerMap] = useState<Record<string, string>>({}); // keep

  const loadTechnicianMap = async () => {
    const snapshot = await getDocs(collection(db, 'staffs'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      if (data.userId) map[data.userId] = data.name || 'Unnamed';
    });
    return map;
  };

  const loadUserMap = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      map[d.id] = data.name || data.email || 'Unknown';
    });
    return map;
  };

  const loadTechnicianPartnerMap = async () => {
    const snapshot = await getDocs(collection(db, 'technicianPartners'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      map[d.id] = data.name || 'Unnamed Partner';
    });
    return map;
  };

  const fetchVehicleIssues = async () => {
    setLoading(true);
    try {
      const [techMap, usrMap, partnerNameMap] = await Promise.all([
        loadTechnicianMap(),
        loadUserMap(),
        loadTechnicianPartnerMap(),
      ]);

      const snap = await getDocs(collection(db, 'publicVehicleIssues'));
      const rawIssues = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PublicVehicleIssue)
      );

      const enriched = rawIssues.map((issue) => ({
        ...issue,
        assignedToName:
          issue.assignedToName ??
          (issue.assignedTo ? partnerNameMap[issue.assignedTo] : undefined) ??
          (issue.assignedTo ? techMap[issue.assignedTo] : undefined),
        closedByName:
          issue.closedByName ??
          (issue.closedBy ? usrMap[issue.closedBy] : undefined),
      }));

      setTechnicianMap(techMap);
      setUserMap(usrMap);
      setPartnerMap(partnerNameMap);
      setIssues(enriched);
    } catch (error) {
      console.error('❌ Failed to fetch public vehicle issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleIssues();
  }, []);

  /**
   * Bảo đảm: updatedAt luôn sau createdAt (thời gian báo cáo).
   * - Check nhanh phía client: Date.now() > createdAt
   * - Gửi updatedAt = serverTimestamp() để Rules kiểm soát
   */
  const updateIssue = async (id: string, data: Partial<PublicVehicleIssue>) => {
    const ref = doc(db, 'publicVehicleIssues', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Issue not found');

    const current = snap.data() as PublicVehicleIssue;
    if (!current.createdAt) {
      throw new Error('Issue has no createdAt to compare against');
    }

    const now = Date.now();
    const createdMs = current.createdAt.toMillis();
    if (now <= createdMs) {
      throw new Error('Cập nhật không hợp lệ: updatedAt phải sau thời gian báo cáo (createdAt).');
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(), // luôn ghi đè
    });
  };

  return {
    issues,
    loading,
    updateIssue,
    technicianMap,
    userMap,
    partnerMap,     // ⬅️ expose luôn cho tiện
    fetchVehicleIssues,
  };
}
