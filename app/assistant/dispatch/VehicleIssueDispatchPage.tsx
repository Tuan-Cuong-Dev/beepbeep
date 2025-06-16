'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { VehicleIssueStatus, ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import { Staff } from '@/src/lib/staff/staffTypes';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function VehicleIssueDispatchPage() {
  const { user } = useUser();
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [technicians, setTechnicians] = useState<Staff[]>([]);
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchIssues = async () => {
      const q = query(
        collection(db, 'vehicleIssues'),
        where('status', '==', 'pending'),
        where('assignedTo', '==', null)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExtendedVehicleIssue));
      setIssues(data);
    };

    const fetchTechnicians = async () => {
      const q = query(collection(db, 'staffs'), where('role', '==', 'technician'));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Staff));
      setTechnicians(data);
    };

    fetchIssues();
    fetchTechnicians();
  }, []);

  const handleAssign = async (issueId: string) => {
    const technicianId = assignMap[issueId];
    if (!technicianId || !user?.uid) return;

    const issueRef = doc(db, 'vehicleIssues', issueId);
    await updateDoc(issueRef, {
      assignedTo: technicianId,
      assignedBy: user.uid,
      assignedAt: Timestamp.now(),
      status: 'assigned' satisfies VehicleIssueStatus,
    });

    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-10 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          🚚 Dispatch Vehicle Issues
        </h1>

        {issues.length === 0 ? (
          <p className="text-center text-gray-600">✅ All pending issues have been assigned.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Issue</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Reported At</th>
                  <th className="p-3">Assign To</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{issue.description?.slice(0, 40) || '-'}</td>
                    <td className="p-3">{issue.stationName || issue.customerLocation || '-'}</td>
                    <td className="p-3">{issue.reportedAt?.toDate().toLocaleString() || '-'}</td>
                    <td className="p-3">
                      <SimpleSelect
                        value={assignMap[issue.id] || ''}
                        onChange={(val) => setAssignMap({ ...assignMap, [issue.id]: val })}
                        options={technicians.map((t) => ({
                          label: t.name,
                          value: t.userId,
                        }))}
                      />
                    </td>
                    <td className="p-3">
                      <Button size="sm" onClick={() => handleAssign(issue.id)}>
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
