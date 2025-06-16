'use client';

import { useEffect, useState } from 'react';
import { getDocs, query, where, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import VehicleIssueTable from '@/src/components/vehicleIssues/VehicleIssueTable';
import ApproveProposalDialog from '@/src/components/vehicleIssues/ApproveProposalDialog';
import ViewProposalDialog from '@/src/components/vehicleIssues/ViewProposalDialog';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';

export default function VehicleIssueProposalsPage() {
  const { user, role, companyId } = useUser();
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewingProposal, setViewingProposal] = useState<ExtendedVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<ExtendedVehicleIssue | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchIssues = async () => {
      const q = query(
        collection(db, 'vehicleIssues'),
        where('companyId', '==', companyId),
        where('status', '==', 'proposed')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ExtendedVehicleIssue[];
      setIssues(data);
      setLoading(false);
    };

    fetchIssues();
  }, [companyId]);

  const updateIssue = async (id: string, data: Partial<ExtendedVehicleIssue>) => {
    const issueRef = doc(db, 'vehicleIssues', id);
    await updateDoc(issueRef, data);
    setIssues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  if (!user || loading) return <div className="text-center py-10">⏳ Loading proposals...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
          title="Vehicle Issue Proposals"
          subtitle="Review and approve proposed solutions by technicians."
        <div className="bg-white shadow rounded-lg border overflow-auto">
          <VehicleIssueTable
            issues={issues}
            technicianMap={{}}
            onEdit={() => {}}
            updateIssue={updateIssue}
            setClosingIssue={() => {}}
            setCloseDialogOpen={() => {}}
            setEditingIssue={() => {}}
            setShowForm={() => {}}
            normalizedRole={role}
            isAdmin={true}
            isTechnician={false}
            searchTerm=""
            statusFilter="proposed"
            stationFilter=""
            setProposingIssue={() => {}}
            setUpdatingActualIssue={() => {}}
          />
        </div>
      </main>
      <Footer />

      <ViewProposalDialog
        open={!!viewingProposal}
        issue={viewingProposal}
        onClose={() => setViewingProposal(null)}
      />

      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposal(null)}
        onApprove={async () => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, { status: 'confirmed' });
            setApprovingProposal(null);
          }
        }}
        onReject={async (reason) => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, {
              status: 'rejected',
              closeComment: reason,
            });
            setApprovingProposal(null);
          }
        }}
      />
    </div>
  );
}
