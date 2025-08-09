import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { Ebike } from "@/src/lib/vehicles/ebikeTypes";

export function useEbikeListByCompany(companyId: string) {
  const [ebikes, setEbikes] = useState<Ebike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEbikes = async () => {
      if (!companyId) return;

      const q = query(collection(db, "ebikes"), where("companyId", "==", companyId));
      const snap = await getDocs(q);
      const list: Ebike[] = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Ebike, 'id'>)
      }));
      
      setEbikes(list);
      setLoading(false);
    };

    fetchEbikes();
  }, [companyId]);

  return { ebikes, loading };
}
