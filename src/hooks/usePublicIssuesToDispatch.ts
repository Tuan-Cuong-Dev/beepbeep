// 📁 hooks/usePublicIssuesToDispatch.ts
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { PublicIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

export function usePublicIssuesToDispatch() {
  const [issues, setIssues] = useState<PublicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [partnerMap, setPartnerMap] = useState<Record<string, string>>({}); // ⬅️ NEW

  // staffs: map userId -> name (trường hợp bạn còn dùng staffs ở nơi khác)
  const loadTechnicianMap = async () => {
    const snapshot = await getDocs(collection(db, 'staffs'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      if (data.userId) {
        map[data.userId] = data.name || 'Unnamed';
      }
    });
    return map;
  };

  // users: map doc.id -> name/email
  const loadUserMap = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      map[d.id] = data.name || data.email || 'Unknown';
    });
    return map;
  };

  // technicianPartners: map doc.id -> name  ⬅️ NEW (khớp với assignedTo bạn đang lưu)
  const loadTechnicianPartnerMap = async () => {
    const snapshot = await getDocs(collection(db, 'technicianPartners'));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((d) => {
      const data = d.data() as any;
      map[d.id] = data.name || 'Unnamed Partner';
    });
    return map;
  };

  // Load và enrich
  const fetchVehicleIssues = async () => {
    setLoading(true);
    try {
      const [techMap, usrMap, partnerNameMap] = await Promise.all([
        loadTechnicianMap(),
        loadUserMap(),
        loadTechnicianPartnerMap(), // ⬅️ NEW
      ]);

      const snap = await getDocs(collection(db, 'publicVehicleIssues'));
      const rawIssues = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PublicIssue)
      );

      const enriched = rawIssues.map((issue) => ({
        ...issue,
        // ⬇️ ƯU TIÊN GIỮ field đã lưu trong Firestore
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
