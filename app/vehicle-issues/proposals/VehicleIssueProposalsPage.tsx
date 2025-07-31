'use client';

import { useEffect, useState } from 'react';
import { getDocs, query, where, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { ExtendedVehicleIssue } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import VehicleIssueTable from '@/src/components/vehicle-issues/VehicleIssueTable';
import ApproveProposalDialog from '@/src/components/vehicle-issues/ApproveProposalDialog';
import ViewProposalDialog from '@/src/components/vehicle-issues/ViewProposalDialog';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useTranslation } from 'react-i18next';

export default function VehicleIssueProposalsPage() {
  const { t } = useTranslation('common');
  const { user, role, companyId } = useUser();
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProposal, setViewingProposal] = useState<ExtendedVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<ExtendedVehicleIssue | null>(null);

  const fetchIssues = async () => {
    if (!companyId) return;
    setLoading(true);
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

  useEffect(() => {
    fetchIssues();
  }, [companyId]);

  const updateIssue = async (id: string, data: Partial<ExtendedVehicleIssue>) => {
    const issueRef = doc(db, 'vehicleIssues', id);
    await updateDoc(issueRef, data);
    setIssues((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  if (!user || loading) {
    return <div className="text-center py-10">{t('vehicle_issue_proposals_page.loading')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t('vehicle_issue_proposals_page.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('vehicle_issue_proposals_page.subtitle')}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg border overflow-auto">
          {issues.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {t('vehicle_issue_proposals_page.empty')}
            </div>
          ) : (
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
              setViewingProposal={setViewingProposal}
              setApprovingProposal={setApprovingProposal}
              refetchIssues={fetchIssues}
            />
          )}
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
