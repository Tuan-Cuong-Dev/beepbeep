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
import PublicIssuesSummaryCard from '@/src/components/public-vehicle-issues/PublicIssueSummaryCard';
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

/** ✅ NEW: Bản đồ kỹ thuật viên thời gian thực (Admin/Assistant) */
import TechnicianLiveMap from '@/src/components/admin/TechnicianLiveMap';

type LatLng = { lat: number; lng: number };
type Status = 'All' | PublicVehicleIssue['status'];

/** Chuẩn hoá mọi kiểu toạ độ thành {lat,lng} hoặc null */
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

export default function PublicIssueDispatchPage() {
  const { t } = useTranslation('common', { keyPrefix: 'public_issue_dispatch_page' });
  const { role, user } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isTechAssistant = normalizedRole === 'technician_assistant';
  const isTechnicianPartner = normalizedRole === 'technician_partner';

  const canView = isAdmin || isTechAssistant || isTechnicianPartner;
  const canAssign = isAdmin || isTechAssistant;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status>('All');
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

  // ⬇️ Refactor: dùng refresh thay cho fetchVehicleIssues
  const { issues, loading, updateIssue, refresh } = usePublicIssuesToDispatch();

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  useEffect(() => {
    if (!dialog.open) return;
    const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 3000);
    return () => clearTimeout(timer);
  }, [dialog.open]);

  // 1) Lọc theo quyền: partner chỉ thấy issue được assign cho họ
  const scopedIssues = useMemo(() => {
    if (isTechnicianPartner) {
      const uid = user?.uid;
      return issues.filter((i) => i.assignedTo === uid);
    }
    return issues; // admin & technician_assistant thấy tất cả
  }, [issues, isTechnicianPartner, user?.uid]);

  // 2) Lọc theo UI (search/status/station)
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

  // 3) Tính map center (ưu tiên issue đang chỉnh sửa)
  const mapIssue = useMemo(() => {
    const eCoord = normalizeCoords(editingIssue?.location?.coordinates as any);
    if (editingIssue && eCoord) return editingIssue;
    return filteredIssues.find((i) => !!normalizeCoords((i.location as any)?.coordinates)) || null;
  }, [editingIssue, filteredIssues]);

  const mapCenter = useMemo<LatLng | null>(() => {
    return normalizeCoords((mapIssue?.location as any)?.coordinates);
  }, [mapIssue]);

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;
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
      await refresh(); // ⬅️ refetch khi không bật realtime
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
    await refresh(); // ⬅️
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
    await refresh(); // ⬅️
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
    await refresh(); // ⬅️
  };

  const handleApprove = async () => {
    if (!approvingProposal?.id) return;
    await updateIssue(approvingProposal.id, { status: 'confirmed' });
    showDialog('success', t('messages.approve_success'));
    setApprovingProposal(null);
    await refresh(); // ⬅️
  };

  const handleReject = async (reason: string) => {
    if (!approvingProposal?.id) return;
    await updateIssue(approvingProposal.id, { status: 'rejected', closeComment: reason });
    showDialog('success', t('messages.reject_success'));
    setApprovingProposal(null);
    await refresh(); // ⬅️
  };

  // ===== Render =====
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* ✅ NEW: Bản đồ kỹ thuật viên thời gian thực (chỉ Admin & Assistant) */}
        {(isAdmin || isTechAssistant) && (
          <section className="bg-white rounded-2xl shadow p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {t('admin_live_map_page.map.title', { ns: 'common' })}
                </h2>
                <p className="text-xs text-gray-500">
                  {t('admin_live_map_page.map.hint_click', { ns: 'common' })}
                </p>
              </div>
            </div>
            <TechnicianLiveMap />
          </section>
        )}

        {/* Summary dùng scopedIssues để khớp quyền */}
        <PublicIssuesSummaryCard issues={scopedIssues} />

        {/* Filters */}
        <PublicIssuesSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
        />

        {/* Map: dựa trên scopedIssues đã lọc quyền */}
        {mapCenter && (
          <NearbySupportMap
            issueCoords={mapCenter}
            issues={scopedIssues}
            limitPerType={5}
            showNearestShops={isAdmin || isTechAssistant} // chỉ Admin & Assistant thấy Shop
            showNearestMobiles={true}                      // ai cũng thấy KTV lưu động
          />
        )}

        {/* Bảng issues: đã lọc theo quyền + UI */}
        <PublicIssueTable
          issues={filteredIssues}
          updateIssue={updateIssue}
          onEdit={(issue) => {
            setEditingIssue(issue);
            if (canAssign) setShowForm(true); // chỉ admin/assistant mở form phân công
          }}
          setClosingIssue={setClosingIssue}
          setCloseDialogOpen={setCloseDialogOpen}
          setEditingIssue={setEditingIssue}
          setShowForm={setShowForm}
          normalizedRole={normalizedRole}
          isAdmin={isAdmin}
          isTechnician={isTechnicianPartner} // partner như technician ở UI
          setProposingIssue={setProposingIssue}
          setUpdatingActualIssue={setUpdatingActualIssue}
          setViewingProposal={setViewingProposal}
          setApprovingProposal={setApprovingProposal}
        />

        {/* Form phân công: chỉ admin/assistant */}
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
