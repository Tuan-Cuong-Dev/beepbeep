'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { useVehicleIssues } from '@/src/hooks/useVehicleIssues';
import { useTechnicianMap } from '@/src/hooks/useTechnicianMap';
import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import ProposalPopup from '@/src/components/vehicleIssues/ProposalPopup';
import ActualResultPopup from '@/src/components/vehicleIssues/ActualResultPopup';
import Link from 'next/link';
import { Wrench, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  });
}

function renderStatusBadge(status: VehicleIssueStatus) {
  const colorMap: Record<VehicleIssueStatus, string> = {
    pending: 'bg-gray-400',
    assigned: 'bg-blue-500',
    proposed: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    rejected: 'bg-red-500',
    in_progress: 'bg-indigo-500',
    resolved: 'bg-purple-500',
    closed: 'bg-black',
  };

  return (
    <span className={`px-2 py-1 text-white rounded ${colorMap[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function TechnicianDashboard() {
  const { user, role, companyId } = useUser();
  const [notification, setNotification] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isTechnician, setIsTechnician] = useState(false);
  const [proposingIssue, setProposingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<ExtendedVehicleIssue | null>(null);

  const { technicianMap, loading: technicianMapLoading } = useTechnicianMap(companyId ?? undefined);
  const { issues, updateIssue, loading: issuesLoading } = useVehicleIssues({
    companyId: companyId ?? undefined,
    role: role ?? undefined,
    technicianUserId: isTechnician ? user?.uid : undefined,
  });

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const q = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const staff = snap.docs[0].data();
        setIsTechnician((staff.role || '').toLowerCase() === 'technician');
      }
      setCheckingRole(false);
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!user || checkingRole) return <div className="text-center py-10">🔎 Checking permission...</div>;
  if (!isTechnician) return <div className="text-center py-10 text-red-500">🚫 Technician only.</div>;
  if (issuesLoading || technicianMapLoading) return <div className="text-center py-10">⏳ Loading...</div>;

  const handleUpdateStatus = async (issue: ExtendedVehicleIssue, newStatus: VehicleIssueStatus) => {
    await updateIssue(issue.id, { status: newStatus });
    setNotification(`Status updated to "${newStatus}".`);
  };

  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue) return;
    await updateIssue(proposingIssue.id, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost,
    });
    setNotification('Proposal submitted for approval.');
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
    });
    setNotification('Actual result submitted and issue marked resolved.');
    setUpdatingActualIssue(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 space-y-10 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">🛠️ Technician Dashboard</h1>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard icon={<ClipboardList />} title="Assigned" value={issues.length.toString()} />
          <DashboardCard icon={<AlertTriangle />} title="Proposed" value={issues.filter(i => i.status === 'proposed').length.toString()} />
          <DashboardCard icon={<Wrench />} title="In Progress" value={issues.filter(i => i.status === 'in_progress').length.toString()} />
          <DashboardCard icon={<CheckCircle />} title="Resolved" value={issues.filter(i => i.status === 'resolved').length.toString()} />
        </section>

        <section className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <QuickAction label="View My Issues" href="/vehicle-issues" />
            <QuickAction label="Proposal History" href="/vehicle-issues/proposals" />
            <QuickAction label="View Reports" href="/reports" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🚧 Assigned Issues</h2>

          {/* Table for desktop */}
          <div className="hidden md:block overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">VIN</th>
                  <th className="p-2">Plate</th>
                  <th className="p-2">Issue Type</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Company</th>
                  <th className="p-2">Station</th>
                  <th className="p-2">Reported By</th>
                  <th className="p-2">Reported At</th>
                  <th className="p-2">Proposed Solution</th>
                  <th className="p-2">Proposed Cost</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...issues]
                  .sort((a, b) => (b.reportedAt?.toDate().getTime() ?? 0) - (a.reportedAt?.toDate().getTime() ?? 0))
                  .map(issue => (
                    <tr key={issue.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{issue.vin}</td>
                      <td className="p-2">{issue.plateNumber}</td>
                      <td className="p-2">{issue.issueType}</td>
                      <td className="p-2">{issue.description}</td>
                      <td className="p-2">{renderStatusBadge(issue.status)}</td>
                      <td className="p-2">{issue.companyName}</td>
                      <td className="p-2">{issue.stationName}</td>
                      <td className="p-2">{issue.reportedBy}</td>
                      <td className="p-2">{issue.reportedAt?.toDate().toLocaleString()}</td>
                      <td className="p-2">{issue.proposedSolution || '-'}</td>
                      <td className="p-2">{issue.proposedCost ? formatCurrency(issue.proposedCost) : '-'}</td>
                      <td className="p-2 space-x-2">
                        {issue.status === 'assigned' && (
                          <Button onClick={() => setProposingIssue(issue)}>Submit Proposal</Button>
                        )}
                        {issue.status === 'confirmed' && (
                          <Button onClick={() => handleUpdateStatus(issue, 'in_progress')}>Mark In Progress</Button>
                        )}
                        {issue.status === 'in_progress' && (
                          <Button onClick={() => setUpdatingActualIssue(issue)}>
                            Complete & Submit Actual Result
                          </Button>
                        )}
                        {issue.status === 'proposed' && <span className="text-green-600">Waiting Approval</span>}
                        {issue.status === 'rejected' && <span className="text-gray-400 italic">No actions</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Cards for mobile */}
          <div className="md:hidden space-y-4">
            {issues.map(issue => (
              <div key={issue.id} className="border rounded-xl p-4 bg-white shadow">
                <div className="text-sm font-semibold mb-2">{issue.issueType} – {renderStatusBadge(issue.status)}</div>
                <p className="text-sm text-gray-600"><strong>VIN:</strong> {issue.vin}</p>
                <p className="text-sm text-gray-600"><strong>Plate:</strong> {issue.plateNumber}</p>
                <p className="text-sm text-gray-600"><strong>Description:</strong> {issue.description}</p>
                <p className="text-sm text-gray-600"><strong>Company:</strong> {issue.companyName}</p>
                <p className="text-sm text-gray-600"><strong>Station:</strong> {issue.stationName}</p>
                <p className="text-sm text-gray-600"><strong>Reported:</strong> {issue.reportedAt?.toDate().toLocaleString()}</p>

                <div className="mt-3 space-y-2">
                  {issue.status === 'assigned' && (
                    <Button className="w-full" onClick={() => setProposingIssue(issue)}>Submit Proposal</Button>
                  )}
                  {issue.status === 'confirmed' && (
                    <Button className="w-full" onClick={() => handleUpdateStatus(issue, 'in_progress')}>Mark In Progress</Button>
                  )}
                  {issue.status === 'in_progress' && (
                    <Button className="w-full" onClick={() => setUpdatingActualIssue(issue)}>
                      Complete & Submit Actual Result
                    </Button>
                  )}
                  {issue.status === 'proposed' && <p className="text-green-600 text-center">Waiting Approval</p>}
                  {issue.status === 'rejected' && <p className="text-gray-400 italic text-center">No actions</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <NotificationDialog
        open={!!notification}
        type="success"
        title="Success"
        description={notification || undefined}
        onClose={() => setNotification(null)}
      />

      <ProposalPopup
        open={!!proposingIssue}
        onClose={() => setProposingIssue(null)}
        onSubmit={handlePropose}
      />

      <ActualResultPopup
        open={!!updatingActualIssue}
        onClose={() => setUpdatingActualIssue(null)}
        onSubmit={handleActualSubmit}
      />
    </div>
  );
}

function DashboardCard({ icon, title, value }: { icon: JSX.Element; title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-4">
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-2">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-lg font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-4 py-3 rounded-xl transition">
      {label}
    </Link>
  );
}
