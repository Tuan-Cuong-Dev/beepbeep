// Quản lý issues của hệ thống Bíp Bíp — phiên bản Public (publicVehicleIssues)
'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { useUser } from '@/src/context/AuthContext';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/src/components/ui/dialog';

import AssignTechnicianForm from '@/src/components/public-vehicle-issues/AssignTechnicianForm';
import VehicleIssuesSummaryCard from '@/src/components/public-vehicle-issues/PublicIssueSummaryCard';
import PublicIssuesSearchFilter from '@/src/components/public-vehicle-issues/PublicIssueSearchFilter';
import PublicIssueTable from '@/src/components/public-vehicle-issues/PublicIssueTable';
import ProposalPopup from '@/src/components/public-vehicle-issues/ProposalPopup';
import ActualResultPopup from '@/src/components/public-vehicle-issues/ActualResultPopup';
import ViewProposalDialog from '@/src/components/public-vehicle-issues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/public-vehicle-issues/ApproveProposalDialog';
import NearbySupportMap from '@/src/components/public-vehicle-issues/NearbySupportMap';

import { usePublicIssuesToDispatch } from '@/src/hooks/usePublicIssuesToDispatch';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

type LatLng = { lat: number; lng: number };

// Ẩn trên MAP nếu đã đóng hoặc bị từ chối (kể cả 'proposed' nhưng approveStatus = 'rejected')
// Ẩn marker "Sự cố đang xem" nếu issue đã closed hoặc rejected
function isHiddenOnMap(i: PublicVehicleIssue): boolean {
  const approveRejected = (i as any)?.approveStatus === 'rejected';
  const effective =
    i.status === 'proposed' && approveRejected ? 'rejected' : i.status;
  return effective === 'closed' || effective === 'rejected';
}



function normalizeCoords(coords: any): LatLng | null {
  if (!coords) return null;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    const lat = Number((coords as any).lat);
    const lng = Number((coords as any).lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (typeof coords === 'string' && coords.includes(',')) {
    const [latStr, lngStr] = coords.split(',').map((s) => s.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

export default function PublicVehicleIssuesManagementPage() {
  const { t } = useTranslation('common', { keyPrefix: 'public_issue_dispatch_page' });

  const { role, user, loading: userLoading } = useUser();
  const normalizedRole = role?.toLowerCase();

  const isAdmin = normalizedRole === 'admin';
  const isTechAssistant = normalizedRole === 'technician_assistant';
  const isTechnicianPartner = normalizedRole === 'technician_partner';

  // ai được vào trang
  const canView = isAdmin || isTechAssistant || isTechnicianPartner;
  // ai được mở form phân công
  const canAssign = isAdmin || isTechAssistant;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PublicVehicleIssue['status']>('All');
  const [stationFilter, setStationFilter] = useState('');

  const [editingIssue, setEditingIssue] = useState<PublicVehicleIssue | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingIssue, setClosingIssue] = useState<PublicVehicleIssue | null>(null);
  const [closeComment, setCloseComment] = useState('');

  const [proposingIssue, setProposingIssue] = useState<PublicVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<PublicVehicleIssue | null>(null);

  const [viewingProposal, setViewingProposal] = useState<PublicVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<PublicVehicleIssue | null>(null);

  const { issues, loading, refresh, updateIssue } = usePublicIssuesToDispatch();

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  useEffect(() => {
    if (dialog.open) {
      const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [dialog.open]);

  // ========== Lọc theo quyền trước (partner chỉ thấy issue được assign cho họ) ==========
  const scopedIssues = useMemo(() => {
    if (isTechnicianPartner) {
      const uid = user?.uid;
      return issues.filter((i) => i.assignedTo === uid);
    }
    // admin & technician_assistant thấy tất cả
    return issues;
  }, [issues, isTechnicianPartner, user?.uid]);

  // Chỉ dữ liệu cho MAP: loại closed/rejected
  // Chỉ dữ liệu cho MAP: loại closed/rejected
  const issuesForMap = useMemo(
    () => scopedIssues.filter((i) => !isHiddenOnMap(i)),
    [scopedIssues]
  );



  // ===== Lọc theo UI (search/status/station) =====
  const filteredIssues = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const matchStr = (s?: string) => (s || '').toLowerCase().includes(q);

    return scopedIssues.filter((i) => {
      const okStatus = statusFilter === 'All' ? true : i.status === statusFilter;

      const stationId =
        (i as any).stationId ||
        (i.location as any)?.stationId ||
        (i as any).assignedRegion;
      const okStation = stationFilter ? stationId === stationFilter : true;

      const okSearch = q
        ? [
            i.vehicleLicensePlate,
            i.customerName,
            i.issueDescription,
            i.location?.issueAddress,
            i.vehicleBrand,
            i.vehicleModel,
            i.phone,
            (i as any).assignedToName,
            typeof i.location?.coordinates === 'string'
              ? i.location?.coordinates
              : JSON.stringify(i.location?.coordinates ?? ''),
          ].some((x) => matchStr(String(x ?? '')))
        : true;

      return okStatus && okStation && okSearch;
    });
  }, [scopedIssues, searchTerm, statusFilter, stationFilter]);

  // ===== Map center (ưu tiên issue đang chỉnh sửa) =====
  const mapIssue = useMemo(() => {
    const eCoord = normalizeCoords(editingIssue?.location?.coordinates as any);
    if (editingIssue && eCoord) return editingIssue;
    return filteredIssues.find((i) => !!normalizeCoords((i.location as any)?.coordinates)) || null;
  }, [editingIssue, filteredIssues]);

  // Thêm dòng này ngay sau khi có mapIssue
  const renderFocusMarker = mapIssue ? !isHiddenOnMap(mapIssue) : true;

  const mapCenter = useMemo<LatLng | null>(() => {
    return normalizeCoords((mapIssue?.location as any)?.coordinates);
  }, [mapIssue]);

  // ===== Loading/Permission =====
  if (loading || userLoading) return <div className="text-center py-10">{t('loading')}</div>;
  if (!canView) return <div className="text-center py-10 text-red-500">{t('no_permission')}</div>;

  // ===== Handlers =====
  const handleAssignTechnician = async (userId: string, name: string) => {
    if (!editingIssue?.id) return;
    try {
      await updateIssue(editingIssue.id, {
        assignedTo: userId,
        assignedToName: name,
        assignedAt: Timestamp.fromDate(new Date()),
        status: 'assigned',
      });
      showDialog('success', t('messages.assign_success'));
      setShowForm(false);
      setEditingIssue(null);
      await refresh();
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
      closeComment,
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
      proposedCost: cost,
    });
    showDialog('success', t('messages.proposal_success'));
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue?.id) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
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
      closeComment: reason,
    });
    showDialog('success', t('messages.reject_success'));
    setApprovingProposal(null);
  };

  // ===== Render =====
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Summary: dùng scopedIssues để số liệu khớp quyền */}
        <VehicleIssuesSummaryCard issues={scopedIssues} />

        {/* Filters */}
        <PublicIssuesSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
        />

        {/* Map: dựa trên scopedIssues đã lọc */}
          {mapCenter && (
          <NearbySupportMap
            issueCoords={mapCenter}
            issues={issuesForMap}
            limitPerType={5}
            showNearestShops={isAdmin || isTechAssistant}
            showNearestMobiles={true}
            restrictToTechId={isTechnicianPartner ? (user?.uid ?? null) : null}
            renderFocusMarker={renderFocusMarker}   // 👈 thêm dòng này
          />
        )}



        {/* Bảng issues: hiển thị filteredIssues (đã lọc theo quyền + UI) */}
        <PublicIssueTable
          issues={filteredIssues}
          updateIssue={updateIssue}
          onEdit={(issue) => {
            setEditingIssue(issue);
            // chỉ admin/assistant được mở form phân công
            if (canAssign) setShowForm(true);
          }}
          setClosingIssue={setClosingIssue}
          setCloseDialogOpen={setCloseDialogOpen}
          setEditingIssue={setEditingIssue}
          setShowForm={setShowForm}
          normalizedRole={normalizedRole}
          isAdmin={isAdmin}
          // partner được đối xử như technician ở UI hành động
          isTechnician={isTechnicianPartner}
          setProposingIssue={setProposingIssue}
          setUpdatingActualIssue={setUpdatingActualIssue}
          setViewingProposal={setViewingProposal}
          setApprovingProposal={setApprovingProposal}
        />

        {/* Form phân công: chỉ admin/assistant nhìn thấy */}
        {showForm && editingIssue && canAssign && (
          <div className="bg-white border rounded-xl shadow p-6 space-y-6">
            <h2 className="text-2xl font-bold">{t('assign_title')}</h2>
            <AssignTechnicianForm onAssign={handleAssignTechnician} issueCoords={mapCenter} />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingIssue(null);
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
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
