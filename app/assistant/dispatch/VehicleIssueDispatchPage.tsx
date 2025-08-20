'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/src/components/ui/dialog';
import AssignTechnicianForm from '@/src/components/report-public-issue/AssignTechnicianForm';
import VehicleIssuesSummaryCard from '@/src/components/report-public-issue/PublicIssueSummaryCard';
import VehicleIssuesSearchFilter from '@/src/components/report-public-issue/PublicIssueSearchFilter';
import PublicIssueTable from '@/src/components/report-public-issue/PublicIssueTable';
import ProposalPopup from '@/src/components/report-public-issue/ProposalPopup';
import ActualResultPopup from '@/src/components/report-public-issue/ActualResultPopup';
import ViewProposalDialog from '@/src/components/report-public-issue/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/report-public-issue/ApproveProposalDialog';
import { usePublicIssuesToDispatch } from '@/src/hooks/usePublicIssuesToDispatch';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function PublicIssueDispatchPage() {
  const { t } = useTranslation('common', { keyPrefix: 'public_issue_dispatch_page' });
  const { role, user } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isTechAssistant = normalizedRole === 'technician_assistant';
  const canView = isAdmin || isTechAssistant;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('');
  const [editingIssue, setEditingIssue] = useState<PublicIssue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: ''
  });
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingIssue, setClosingIssue] = useState<PublicIssue | null>(null);
  const [closeComment, setCloseComment] = useState('');
  const [proposingIssue, setProposingIssue] = useState<PublicIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<PublicIssue | null>(null);
  const [viewingProposal, setViewingProposal] = useState<PublicIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<PublicIssue | null>(null);

  const { issues, loading, fetchVehicleIssues, updateIssue } = usePublicIssuesToDispatch();

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  useEffect(() => {
    if (dialog.open) {
      const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [dialog.open]);

  // ⬇️ nhận thêm 'name' và lưu assignedToName
  const handleAssignTechnician = async (userId: string, name: string) => {
    if (!editingIssue?.id) return;
    try {
      await updateIssue(editingIssue.id, {
        assignedTo: userId,
        assignedToName: name,
        assignedAt: new Date() as any,
        status: 'assigned'
      });
      showDialog('success', t('messages.assign_success'));
      setShowForm(false);
      setEditingIssue(null);
      await fetchVehicleIssues();
    } catch {
      showDialog('error', t('messages.assign_failed'));
    }
  };

  const handleSubmitClose = async () => {
    if (!closingIssue?.id) return;
    await updateIssue(closingIssue.id, {
      status: 'closed',
      closedAt: Timestamp.fromDate(new Date()),
      closedBy: user?.uid || '',
      closeComment
    });
    showDialog('success', t('messages.close_success'));
    setCloseDialogOpen(false);
    setClosingIssue(null);
    setCloseComment('');
  };

  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue?.id) return;
    await updateIssue(proposingIssue.id, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost
    });
    showDialog('success', t('messages.proposal_success'));
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue?.id) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost
    });
    showDialog('success', t('messages.actual_success'));
    setUpdatingActualIssue(null);
  };

  const handleApprove = async () => {
    if (!approvingProposal?.id) return;
    await updateIssue(approvingProposal.id, { status: 'confirmed' });
    showDialog('success', t('messages.approve_success'));
    setApprovingProposal(null);
  };

  const handleReject = async (reason: string) => {
    if (!approvingProposal?.id) return;
    await updateIssue(approvingProposal.id, {
      status: 'rejected',
      closeComment: reason
    });
    showDialog('success', t('messages.reject_success'));
    setApprovingProposal(null);
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;
  if (!canView) return <div className="text-center py-10 text-red-500">{t('no_permission')}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <VehicleIssuesSummaryCard issues={issues} />

        <VehicleIssuesSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
        />

        {showForm && editingIssue && (
          <div className="bg-white border rounded-xl shadow p-6 space-y-6">
            <h2 className="text-2xl font-bold">{t('assign_title')}</h2>
            {/* ⬇️ onAssign trả (id, name) từ AssignTechnicianForm */}
            <AssignTechnicianForm onAssign={handleAssignTechnician} />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingIssue(null); }}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        <PublicIssueTable
          issues={issues}
          updateIssue={updateIssue}
          onEdit={setEditingIssue}
          setClosingIssue={setClosingIssue}
          setCloseDialogOpen={setCloseDialogOpen}
          setEditingIssue={setEditingIssue}
          setShowForm={setShowForm}
          normalizedRole={normalizedRole}
          isAdmin={isAdmin}
          isTechnician={false}
          setProposingIssue={setProposingIssue}
          setUpdatingActualIssue={setUpdatingActualIssue}
          setViewingProposal={setViewingProposal}
          setApprovingProposal={setApprovingProposal}
        />
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogTitle>{t('close_dialog.title')}</DialogTitle>
          <p className="text-sm text-gray-600 mb-2">{t('close_dialog.desc')}</p>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder={t('close_dialog.ph_reason') || ''}
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>
              {t('close_dialog.btn_cancel')}
            </Button>
            <Button className="bg-green-600 text-white" onClick={handleSubmitClose}>
              {t('close_dialog.btn_close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProposalPopup open={!!proposingIssue} onClose={() => setProposingIssue(null)} onSubmit={handlePropose} />
      <ActualResultPopup open={!!updatingActualIssue} onClose={() => setUpdatingActualIssue(null)} onSubmit={handleActualSubmit} />
      <ViewProposalDialog open={!!viewingProposal} issue={viewingProposal} onClose={() => setViewingProposal(null)} />
      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposal(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
