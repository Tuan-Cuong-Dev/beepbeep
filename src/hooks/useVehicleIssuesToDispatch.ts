// 📁 hooks/useVehicleIssuesToDispatch.ts
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';

export function useVehicleIssuesToDispatch() {
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // ✅ Fetch ALL vehicle issues
      const snap = await getDocs(collection(db, 'vehicleIssues'));
      const rawIssues = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ExtendedVehicleIssue)
      );

      // Fetch technician names
      const techSnap = await getDocs(collection(db, 'staffs'));
      const techMap: Record<string, string> = {};
      techSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.userId) techMap[data.userId] = data.name || 'Unnamed';
      });

      // Fetch user names
      const userSnap = await getDocs(collection(db, 'users'));
      const usrMap: Record<string, string> = {};
      userSnap.docs.forEach((doc) => {
        const data = doc.data();
        usrMap[doc.id] = data.name || data.email || 'Unknown';
      });

      // Enrich issues
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

    fetchData();
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
  };
}

