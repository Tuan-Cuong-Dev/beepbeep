// Lấy dữ liệu sự cố đã báo bởi người dùng 
// Query theo :   reportedBy?: string; trong publicVehicleIssues types

// hooks/useMyReportedIssues.ts
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

export function useMyReportedIssues(userId?: string) {
  const [issues, setIssues] = useState<PublicVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIssues([]); setLoading(false); return; }

    // ❌ Không orderBy → khỏi cần index
    const q = query(
      collection(db, 'publicVehicleIssues'),
      where('reportedBy', '==', userId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicVehicleIssue));
        // ✅ Sort ở client theo createdAt desc
        rows.sort((a, b) => {
          const ams = a.createdAt?.toMillis?.() ?? 0;
          const bms = b.createdAt?.toMillis?.() ?? 0;
          return bms - ams;
        });
        setIssues(rows);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load my reported issues:', err);
        setIssues([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  return { issues, loading };
}
