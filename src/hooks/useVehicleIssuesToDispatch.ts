// 📁 hooks/useVehicleIssuesToDispatch.ts
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';

export function useVehicleIssuesToDispatch() {
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // ✅ Cho phép gọi lại
  const fetchVehicleIssues = async () => {
    setLoading(true);

    const snap = await getDocs(collection(db, 'vehicleIssues'));
    const rawIssues = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ExtendedVehicleIssue)
    );

    const techSnap = await getDocs(collection(db, 'staffs'));
    const techMap: Record<string, string> = {};
    techSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.userId) techMap[data.userId] = data.name || 'Unnamed';
    });

    const userSnap = await getDocs(collection(db, 'users'));
    const usrMap: Record<string, string> = {};
    userSnap.docs.forEach((doc) => {
      const data = doc.data();
      usrMap[doc.id] = data.name || data.email || 'Unknown';
    });

    const enriched = rawIssues.map((issue) => ({
      ...issue,
      assignedToName: issue.assignedTo ? techMap[issue.assignedTo] : undefined,
      closedByName: issue.closedBy ? usrMap[issue.closedBy] : undefined,
    }));

    setTechnicianMap(techMap);
    setUserMap(usrMap);
    setIssues(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicleIssues();
  }, []);

  const updateIssue = async (id: string, data: Partial<ExtendedVehicleIssue>) => {
    await updateDoc(doc(db, 'vehicleIssues', id), data);
  };

  return {
    issues,
    loading,
    updateIssue,
    technicianMap,
    userMap,
    fetchVehicleIssues, // ✅ Export hàm reload data
  };
}
