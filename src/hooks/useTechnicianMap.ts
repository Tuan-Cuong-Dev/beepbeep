"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Custom hook dùng để lấy danh sách technicians (map userId -> name)
 * theo companyId.
 */
export function useTechnicianMap(companyId?: string) {
  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setTechnicianMap({});
      setLoading(false);
      return;
    }

    const fetchTechnicians = async () => {
      setLoading(true);

      try {
        const q = query(
          collection(db, "staffs"),
          where("companyId", "==", companyId),
          where("role", "in", ["technician", "Technician"])
        );

        const snapshot = await getDocs(q);
        const map: Record<string, string> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId;
          const name = data.name;

          if (userId) {
            map[userId] = name || "Unnamed Technician";
          }
        });

        setTechnicianMap(map);
      } catch (error) {
        console.error("❌ Error fetching technicians:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [companyId]);

  return { technicianMap, loading };
}
