'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Pagination from '@/src/components/ui/pagination';
import { useUser } from '@/src/context/AuthContext';
import { useVehicleIssuesToDispatch } from '@/src/hooks/useVehicleIssuesToDispatch';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import AssignTechnicianForm from '@/src/components/vehicleIssues/AssignTechnicianForm';
import VehicleIssuesSummaryCard from '@/src/components/vehicleIssues/VehicleIssuesSummaryCard';
import VehicleIssuesSearchFilter from '@/src/components/vehicleIssues/VehicleIssuesSearchFilter';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/src/components/ui/dialog';
import VehicleIssueTable from '@/src/components/vehicleIssues/VehicleIssueTable';
import ProposalPopup from '@/src/components/vehicleIssues/ProposalPopup';
import ActualResultPopup from '@/src/components/vehicleIssues/ActualResultPopup';
import { Timestamp } from 'firebase/firestore';

export default function VehicleIssueDispatchPage() {
  const { role, companyId, user, loading: userLoading } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isTechnician = normalizedRole === 'technician';
  const isTechAssistant = normalizedRole === 'technician_assistant';
  const canView = isAdmin || isTechAssistant;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('');
  const [editingIssue, setEditingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dialog, setDialog] = useState({ open: false, type: 'info' as 'success' | 'error' | 'info', title: '', description: '' });
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingIssue, setClosingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [closeComment, setCloseComment] = useState('');
  const [proposingIssue, setProposingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { issues, loading } = useVehicleIssuesToDispatch();
  const updateIssue = async (id: string, data: Partial<ExtendedVehicleIssue>) => {
    // TODO: Replace with shared update logic if needed
  };

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  useEffect(() => {
    if (dialog.open) {
      const timer = setTimeout(() => setDialog((prev) => ({ ...prev, open: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [dialog.open]);

  const handleAssignTechnician = async (userId: string) => {
    if (!editingIssue) return;
    try {
      await updateIssue(editingIssue.id, {
        assignedTo: userId,
        assignedAt: new Date() as any,
        status: 'assigned',
      } as any);
      showDialog('success', 'Technician assigned successfully');
      setShowForm(false);
      setEditingIssue(null);
    } catch {
      showDialog('error', 'Failed to assign technician');
    }
  };

  const handleSubmitClose = async () => {
    if (!closingIssue) return;
    await updateIssue(closingIssue.id, {
      status: 'closed',
      closedAt: Timestamp.fromDate(new Date()),
      closedBy: user?.uid || '',
      closeComment,
    });
    showDialog('success', 'Issue closed successfully');
    setCloseDialogOpen(false);
    setClosingIssue(null);
    setCloseComment('');
  };

  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue) return;
    await updateIssue(proposingIssue.id, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost,
    });
    showDialog('success', 'Proposal submitted for approval');
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
    });
    showDialog('success', 'Actual result submitted');
    setUpdatingActualIssue(null);
  };

  const unassignedIssues = issues.filter(i => i.status === 'pending' && !i.assignedTo);

  const filtered = issues.filter((issue) => {
    const matchSearch = `${issue.vin} ${issue.plateNumber} ${issue.description}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || issue.status === statusFilter;
    const matchStation = !stationFilter || issue.stationName === stationFilter;
    return matchSearch && matchStatus && matchStation;
  });

  const sorted = [...filtered].sort((a, b) => (b.reportedAt?.toDate().getTime() ?? 0) - (a.reportedAt?.toDate().getTime() ?? 0));
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stationOptions = Array.from(new Set(issues.map(i => i.stationName).filter(Boolean))).map(name => ({ label: name!, value: name! }));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, stationFilter]);

  if (loading) return <div className="text-center py-10">⏳ Loading...</div>;
  if (!canView) return <div className="text-center py-10 text-red-500">🚫 You do not have permission to view this page.</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">🛠️ Dispatch & Manage Issues</h1>
        <VehicleIssuesSummaryCard issues={issues} />

        {/* 🔸 Unassigned Issues Table */}
        {unassignedIssues.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-yellow-600">🚧 Unassigned Issues</h2>
            <VehicleIssueTable
              issues={unassignedIssues}
              technicianMap={{}}
              onEdit={(issue) => { setEditingIssue(issue); setShowForm(true); }}
              updateIssue={updateIssue}
              setClosingIssue={setClosingIssue}
              setCloseDialogOpen={setCloseDialogOpen}
              setEditingIssue={setEditingIssue}
              setShowForm={setShowForm}
              normalizedRole={normalizedRole}
              isAdmin={isAdmin}
              isTechnician={isTechnician}
              setProposingIssue={setProposingIssue}
              setUpdatingActualIssue={setUpdatingActualIssue}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              stationFilter={stationFilter}
            />
          </div>
        )}

        <VehicleIssuesSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stationFilter={stationFilter}
          setStationFilter={setStationFilter}
          stationOptions={stationOptions}
        />

        {/* 🔹 All Issues Table */}
        <div className="overflow-auto border rounded-xl">
          <VehicleIssueTable
            issues={paginated}
            technicianMap={{}}
            onEdit={(issue) => { setEditingIssue(issue); setShowForm(true); }}
            updateIssue={updateIssue}
            setClosingIssue={setClosingIssue}
            setCloseDialogOpen={setCloseDialogOpen}
            setEditingIssue={setEditingIssue}
            setShowForm={setShowForm}
            normalizedRole={normalizedRole}
            isAdmin={isAdmin}
            isTechnician={isTechnician}
            setProposingIssue={setProposingIssue}
            setUpdatingActualIssue={setUpdatingActualIssue}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            stationFilter={stationFilter}
          />
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {showForm && editingIssue && (
          <div className="bg-white border rounded-xl shadow p-6 space-y-6">
            <h2 className="text-2xl font-bold">Assign Technician</h2>
            <AssignTechnicianForm companyId={companyId || ''} onAssign={handleAssignTechnician} />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingIssue(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <NotificationDialog open={dialog.open} type={dialog.type} title={dialog.title} description={dialog.description} onClose={() => setDialog(prev => ({ ...prev, open: false }))} />
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogTitle>Close Vehicle Issue</DialogTitle>
          <p className="text-sm text-gray-600 mb-2">Please enter a comment or reason for closing this issue:</p>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder="Reason for closing..."
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 text-white" onClick={handleSubmitClose}>Close Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProposalPopup open={!!proposingIssue} onClose={() => setProposingIssue(null)} onSubmit={handlePropose} />
      <ActualResultPopup open={!!updatingActualIssue} onClose={() => setUpdatingActualIssue(null)} onSubmit={handleActualSubmit} />
    </div>
  );
}