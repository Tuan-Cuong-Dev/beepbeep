// 📁 hooks/usePublicIssuesToDispatch.ts
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';

export function usePublicIssuesToDispatch() {
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Load map kỹ thuật viên từ staffs collection
  const loadTechnicianMap = async () => {
    const snapshot = await getDocs(collection(db, 'staffs'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        map[data.userId] = data.name || 'Unnamed';
      }
    });
    return map;
  };

  // Load map người dùng từ users collection
  const loadUserMap = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      map[doc.id] = data.name || data.email || 'Unknown';
    });
    return map;
  };

  // Load toàn bộ public issues và enrich dữ liệu
  const fetchVehicleIssues = async () => {
    setLoading(true);
    try {
      const [techMap, usrMap] = await Promise.all([
        loadTechnicianMap(),
        loadUserMap(),
      ]);

      const snap = await getDocs(collection(db, 'publicVehicleIssues'));
      const rawIssues = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as PublicIssue)
      );

      const enriched = rawIssues.map((issue) => ({
        ...issue,
        assignedToName: issue.assignedTo ? techMap[issue.assignedTo] : undefined,
        closedByName: issue.closedBy ? usrMap[issue.closedBy] : undefined,
      }));

      setTechnicianMap(techMap);
      setUserMap(usrMap);
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

  // Cập nhật issue
  const updateIssue = async (id: string, data: Partial<PublicIssue>) => {
    await updateDoc(doc(db, 'publicVehicleIssues', id), data);
  };

  return {
    issues,
    loading,
    updateIssue,
    technicianMap,
    userMap,
    fetchVehicleIssues,
  };
}
