import { useEffect, useState } from "react";
import { db } from "@/src/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { ExtendedVehicleIssue } from "@/src/lib/vehicle-issues/vehicleIssueTypes";

interface Options {
  role?: string;
  companyId?: string;
  technicianUserId?: string;
}

export function useVehicleIssues(options?: Options) {
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [rawIssues, setRawIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const normalizedRole = options?.role?.toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const companyId = options?.companyId;

  // Load technician map
  useEffect(() => {
    if (!companyId && !isAdmin) return;

    const fetchTechnicians = async () => {
      const q = isAdmin
        ? query(collection(db, "staffs"))
        : query(collection(db, "staffs"), where("companyId", "==", companyId));

      const snapshot = await getDocs(q);
      const map: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          map[data.userId] = data.name || "Unnamed Technician";
        }
      });
      setTechnicianMap(map);
    };

    fetchTechnicians();
  }, [companyId, isAdmin]);

  // Load user map (for closedBy)
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const map: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[doc.id] = data.name || data.email || "Unknown User";
      });
      setUserMap(map);
    };

    fetchUsers();
  }, []);

  // Load vehicle issues
  useEffect(() => {
    setLoading(true);
    if (!companyId && !isAdmin && !options?.technicianUserId) {
      setRawIssues([]);
      setIssues([]);
      setLoading(false);
      return;
    }

    let q;
    if (isAdmin) {
      q = query(collection(db, "vehicleIssues"));
    } else if (options?.technicianUserId) {
      q = query(collection(db, "vehicleIssues"), where("assignedTo", "==", options.technicianUserId));
    } else {
      q = query(collection(db, "vehicleIssues"), where("companyId", "==", companyId!));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: ExtendedVehicleIssue[] = snapshot.docs.map(doc => ({
        ...(doc.data() as ExtendedVehicleIssue),
        id: doc.id,
      }));
      setRawIssues(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId, options?.technicianUserId, normalizedRole]);

  // Enrich issues with names
  useEffect(() => {
    const enriched = rawIssues.map(issue => ({
      ...issue,
      assignedToName: issue.assignedTo ? technicianMap[issue.assignedTo] || issue.assignedTo : undefined,
      closedByName: issue.closedBy ? userMap[issue.closedBy] || issue.closedBy : undefined,
    }));
    setIssues(enriched);
  }, [rawIssues, technicianMap, userMap]);

  const updateIssue = async (id: string, data: Partial<ExtendedVehicleIssue>) => {
    await updateDoc(doc(db, "vehicleIssues", id), data);
  };

  return { issues, loading, updateIssue };
}
