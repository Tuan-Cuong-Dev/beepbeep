// Quản lý issues nội bộ công ty
'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import { useUser } from '@/src/context/AuthContext';
import { useVehicleIssues } from '@/src/hooks/useVehicleIssues';
import { useTechnicianMap } from '@/src/hooks/useTechnicianMap';
import type { ExtendedVehicleIssue } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import AssignTechnicianForm from '@/src/components/vehicle-issues/AssignTechnicianForm';
import VehicleIssuesSummaryCard from '@/src/components/vehicle-issues/VehicleIssuesSummaryCard';
import VehicleIssuesSearchFilter from '@/src/components/vehicle-issues/VehicleIssuesSearchFilter';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/src/components/ui/dialog';
import { Timestamp, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import VehicleIssueTable from '@/src/components/vehicle-issues/VehicleIssueTable';
import ProposalPopup from '@/src/components/vehicle-issues/ProposalPopup';
import ActualResultPopup from '@/src/components/vehicle-issues/ActualResultPopup';
import ViewProposalDialog from '@/src/components/vehicle-issues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/vehicle-issues/ApproveProposalDialog';
import { useTranslation } from 'react-i18next';

export default function VehicleIssuesManagementPage() {
  const { t } = useTranslation('common');

  const { role, companyId, stationId, user, loading: userLoading } = useUser();
  const normalizedRole = (role || '').toLowerCase();

  const isAdmin = normalizedRole === 'admin';
  const isTechnician = normalizedRole === 'technician';
  const isTechnicianPartner = normalizedRole === 'technician_partner';
  const isAssistant = normalizedRole === 'technician_assistant';
  const isCompanyRole = ['company_owner', 'company_admin', 'station_manager', 'technician'].includes(normalizedRole);

  // ===== Resolve companyId nếu context chưa có =====
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | undefined>(companyId || undefined);
  const [resolvingCompany, setResolvingCompany] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const resolveCompany = async () => {
      setResolvingCompany(true);
      try {
        // Admin/Assistant không cần companyId
        if (isAdmin || isAssistant) {
          if (mounted) setResolvedCompanyId(undefined);
          return;
        }

        // Nếu đã có companyId trong context -> dùng luôn
        if (companyId) {
          if (mounted) setResolvedCompanyId(companyId);
          return;
        }

        // Nếu có stationId -> lấy companyId từ station
        if (stationId) {
          const st = await getDoc(doc(db, 'rentalStations', stationId));
          if (st.exists()) {
            const cid = (st.data() as any)?.companyId || '';
            if (mounted) setResolvedCompanyId(cid || undefined);
            if (cid) return;
          }
        }

        // company_owner -> tìm rentalCompanies theo ownerId
        if (normalizedRole === 'company_owner' && user?.uid) {
          const rcSnap = await getDocs(
            query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
          );
          const cid = rcSnap.docs[0]?.id || '';
          if (mounted) setResolvedCompanyId(cid || undefined);
          if (cid) return;
        }

        // Các staff khác (bao gồm technician) -> tìm trong 'staff' theo userId
        if (user?.uid) {
          const staffSnap = await getDocs(
            query(collection(db, 'staff'), where('userId', '==', user.uid))
          );
          const cid = staffSnap.docs[0]?.data()?.companyId || '';
          if (mounted) setResolvedCompanyId(cid || undefined);
          return;
        }

        // Không xác định được
        if (mounted) setResolvedCompanyId(undefined);
      } finally {
        if (mounted) setResolvingCompany(false);
      }
    };
    resolveCompany();
    return () => {
      mounted = false;
    };
  }, [isAdmin, isAssistant, companyId, stationId, normalizedRole, user?.uid]);

  // ===== Technician map & issues hooks với phạm vi đúng =====
  const { technicianMap, loading: technicianMapLoading } =
    useTechnicianMap(isAdmin || isAssistant ? undefined : resolvedCompanyId);

  const { issues, loading: issuesLoading, updateIssue } = useVehicleIssues({
    role: role ?? undefined,
    companyId: isAdmin || isAssistant ? undefined : resolvedCompanyId,
    // Lọc theo assignedTo cho technician & technician_partner
    technicianUserId: (isTechnician || isTechnicianPartner) ? user?.uid : undefined,
  });

  const loading = userLoading || technicianMapLoading || issuesLoading || resolvingCompany;

  // ===== UI local states =====
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All');
  const [stationFilter, setStationFilter] = useState('');
  const [editingIssue, setEditingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingIssue, setClosingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [closeComment, setCloseComment] = useState('');

  const [proposingIssue, setProposingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<ExtendedVehicleIssue | null>(null);

  const [viewingProposal, setViewingProposal] = useState<ExtendedVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<ExtendedVehicleIssue | null>(null);

  useEffect(() => {
    if (dialog.open) {
      const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [dialog.open]);

  // ===== Permission =====
  // - Admin / Assistant: luôn có quyền
  // - Company roles: cần resolvedCompanyId
  // - Technician partner: được vào nhưng chỉ thấy việc của chính họ (lọc bằng technicianUserId)
  const canViewIssues =
    isAdmin ||
    isAssistant ||
    (isCompanyRole && !!resolvedCompanyId) ||
    isTechnicianPartner;

  // ===== Handlers =====
  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  const handleAssignTechnician = async (userId: string) => {
    if (!editingIssue) return;
    try {
      await updateIssue(editingIssue.id!, {
        assignedTo: userId,
        assignedAt: new Date() as any,
        status: 'assigned',
      } as any);
      showDialog('success', t('vehicle_issues_management_page.assign_success'));
      setShowForm(false);
      setEditingIssue(null);
    } catch {
      showDialog('error', t('vehicle_issues_management_page.assign_fail'));
    }
  };

  const handleSubmitClose = async () => {
    if (!closingIssue) return;
    await updateIssue(closingIssue.id!, {
      status: 'closed',
      closedAt: Timestamp.fromDate(new Date()),
      closedBy: user?.uid || '',
      closeComment,
    });
    showDialog('success', t('vehicle_issues_management_page.close_success'));
    setCloseDialogOpen(false);
    setClosingIssue(null);
    setCloseComment('');
  };

  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue) return;
    await updateIssue(proposingIssue.id!, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost,
    });
    showDialog('success', t('vehicle_issues_management_page.proposal_success'));
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue) return;
    await updateIssue(updatingActualIssue.id!, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
    });
    showDialog('success', t('vehicle_issues_management_page.actual_success'));
    setUpdatingActualIssue(null);
  };

  const handleApproveProposal = async () => {
    if (!approvingProposal) return;
    await updateIssue(approvingProposal.id!, { status: 'confirmed' });
    showDialog('success', t('vehicle_issues_management_page.approve_success'));
    setApprovingProposal(null);
  };

  const handleRejectProposal = async (reason: string) => {
    if (!approvingProposal) return;
    await updateIssue(approvingProposal.id!, { status: 'rejected', statusComment: reason || '' });
    showDialog('success', t('vehicle_issues_management_page.reject_success'));
    setApprovingProposal(null);
  };

  // ===== Filters / Sorting / Paging =====
  const filteredIssues = issues.filter((issue) => {
    const matchSearch = `${issue.vin} ${issue.plateNumber} ${issue.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'All' || !statusFilter ? true : issue.status === statusFilter;
    const matchStation = stationFilter === '' || !stationFilter ? true : issue.stationName === stationFilter;
    return matchSearch && matchStatus && matchStation;
  });

  const sortedIssues = [...filteredIssues].sort(
    (a, b) => (b.reportedAt?.toDate().getTime() ?? 0) - (a.reportedAt?.toDate().getTime() ?? 0),
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedIssues = sortedIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stationOptions: { label: string; value: string }[] = Array.from(
    new Set(issues.map((i) => i.stationName).filter((name): name is string => !!name)),
  ).map((name) => ({ label: name, value: name }));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, stationFilter]);

  // ===== Render =====
  if (loading) {
    return <div className="text-center py-10">{t('vehicle_issues_management_page.loading')}</div>;
  }

  if (!canViewIssues) {
    return (
      <div className="text-center py-10 text-red-500">
        {t('vehicle_issues_management_page.no_permission')}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t('vehicle_issues_management_page.title')}
          </h1>
          <p className="text-sm text-gray-600">{t('vehicle_issues_management_page.subtitle')}</p>
        </div>

        <VehicleIssuesSummaryCard issues={issues} />

        <VehicleIssuesSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
          stationOptions={stationOptions}
        />

        <div className="overflow-auto border rounded-xl bg-white">
          <VehicleIssueTable
            issues={paginatedIssues}
            technicianMap={technicianMap}
            onEdit={(issue) => {
              setEditingIssue(issue);
              setShowForm(true);
            }}
            updateIssue={updateIssue}
            setClosingIssue={setClosingIssue}
            setCloseDialogOpen={setCloseDialogOpen}
            setEditingIssue={setEditingIssue}
            setShowForm={setShowForm}
            normalizedRole={normalizedRole || ''}
            isAdmin={isAdmin}
            isTechnician={isTechnician}
            isTechnicianPartner={isTechnicianPartner}
            setProposingIssue={setProposingIssue}
            setUpdatingActualIssue={setUpdatingActualIssue}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            stationFilter={stationFilter}
            refetchIssues={async () => {}}
            setViewingProposal={setViewingProposal}
            setApprovingProposal={setApprovingProposal}
          />
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {/* Assign technician form */}
        {showForm && editingIssue && (
          <div className="bg-white border rounded-xl shadow p-6 space-y-6">
            <h2 className="text-2xl font-bold">
              {t('vehicle_issues_management_page.assign_technician')}
            </h2>
            <AssignTechnicianForm
              companyId={resolvedCompanyId || ''} // dùng companyId đã resolve
              onAssign={handleAssignTechnician}
            />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingIssue(null);
                }}
              >
                {t('vehicle_issues_management_page.cancel')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Toast dialog */}
      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Close issue dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogTitle>{t('vehicle_issues_management_page.close_issue')}</DialogTitle>
          <p className="text-sm text-gray-600 mb-2">
            {t('vehicle_issues_management_page.close_reason')}
          </p>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder={t('vehicle_issues_management_page.close_placeholder')}
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>
              {t('vehicle_issues_management_page.cancel')}
            </Button>
            <Button className="bg-green-600 text-white" onClick={handleSubmitClose}>
              {t('vehicle_issues_management_page.close_issue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View proposal */}
      <ViewProposalDialog
        open={!!viewingProposal}
        issue={viewingProposal}
        onClose={() => setViewingProposal(null)}
      />

      {/* Approve / Reject proposal */}
      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposal(null)}
        onApprove={handleApproveProposal}
        onReject={handleRejectProposal}
      />

      {/* Submit proposal (technician) */}
      <ProposalPopup
        open={!!proposingIssue}
        onClose={() => setProposingIssue(null)}
        onSubmit={handlePropose}
      />

      {/* Submit actual result (technician after confirmed) */}
      <ActualResultPopup
        open={!!updatingActualIssue}
        onClose={() => setUpdatingActualIssue(null)}
        onSubmit={handleActualSubmit}
      />
    </div>
  );
}
