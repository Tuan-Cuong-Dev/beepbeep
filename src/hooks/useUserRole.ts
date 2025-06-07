'use client';

import { useEffect, useState } from "react";
import { db } from "@/src/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useUser } from "@/src/context/AuthContext";

export function useUserRole() {
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchRole = async () => {
      setLoading(true);

      try {
        // 1️⃣ Check role from staffs
        const staffSnap = await getDocs(query(collection(db, "staffs"), where("userId", "==", user.uid)));
        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data();
          setRole((staffData.role ?? '').toLowerCase());
          setLoading(false);
          return;
        }

        // 2️⃣ Else → Check role from users
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRole((userData.role ?? '').toLowerCase());
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user?.uid]);

  return {
    role,
    loading,
  };
}
