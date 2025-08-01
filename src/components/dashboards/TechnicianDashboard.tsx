'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { useVehicleIssues } from '@/src/hooks/useVehicleIssues';
import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import ProposalPopup from '@/src/components/vehicle-issues/ProposalPopup';
import ActualResultPopup from '@/src/components/vehicle-issues/ActualResultPopup';
import { Wrench, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { JSX } from 'react/jsx-runtime';
import { useTranslation } from 'react-i18next';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  });
}

function renderStatusBadge(status: VehicleIssueStatus, t: any) {
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
  return <span className={`px-2 py-1 text-white rounded ${colorMap[status]}`}>{t(`status.${status}`)}</span>;
}

export default function TechnicianDashboard() {
  const { t } = useTranslation('common');
  const getTranslatedIssueType = (rawType: string) => {
    const normalized = rawType.toLowerCase().replace(/\s+/g, '_');
    return t(`vehicle_issue_type.${normalized}`, { defaultValue: rawType });
  };

  const { user, role, loading: userLoading } = useUser();
  const [notification, setNotification] = useState<string | null>(null);
  const [proposingIssue, setProposingIssue] = useState<ExtendedVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<ExtendedVehicleIssue | null>(null);

  const isTechnician = role === 'technician';

  const { issues, updateIssue, loading: issuesLoading } = useVehicleIssues(
    !isTechnician ? { disabled: true } as any : { technicianUserId: user?.uid, role: 'technician' }
  );

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!user || userLoading) return <div className="text-center py-10">🔎 {t('technician_partner_dashboard.checking_permission')}</div>;
  if (!isTechnician) return <div className="text-center py-10 text-red-500">🚫 {t('technician_partner_dashboard.only_for_technician_partner')}</div>;
  if (issuesLoading) return <div className="text-center py-10">⏳ {t('technician_partner_dashboard.loading_issues')}</div>;

  const handleUpdateStatus = async (issue: ExtendedVehicleIssue, newStatus: VehicleIssueStatus) => {
    await updateIssue(issue.id, { status: newStatus });
    setNotification(t('technician_partner_dashboard.status_updated', { status: t(`status.${newStatus}`) }));
  };

  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue) return;
    await updateIssue(proposingIssue.id, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost,
    });
    setNotification(t('technician_partner_dashboard.proposal_submitted'));
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
    });
    setNotification(t('technician_partner_dashboard.actual_result_submitted'));
    setUpdatingActualIssue(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 space-y-10 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          🛠️ {t('technician_partner_dashboard.title')}
        </h1>

        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard icon={<ClipboardList />} title={t('technician_partner_dashboard.summary.assigned')} value={issues.length.toString()} />
          <DashboardCard icon={<AlertTriangle />} title={t('technician_partner_dashboard.summary.proposed')} value={issues.filter(i => i.status === 'proposed').length.toString()} />
          <DashboardCard icon={<Wrench />} title={t('technician_partner_dashboard.summary.in_progress')} value={issues.filter(i => i.status === 'in_progress').length.toString()} />
          <DashboardCard icon={<CheckCircle />} title={t('technician_partner_dashboard.summary.resolved')} value={issues.filter(i => i.status === 'resolved').length.toString()} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction label={t('technician_partner_dashboard.quick_actions.my_issues')} href="/vehicle-issues" />
            <QuickAction label={t('technician_partner_dashboard.quick_actions.proposal_history')} href="/vehicle-issues/proposals" />
            <QuickAction label={t('technician_partner_dashboard.quick_actions.suggest_error_fix')} href="/vehicle-issues/suggest-error" />
            <QuickAction label={t('technician_partner_dashboard.quick_actions.error_codes')} href="/vehicle-issues/error-codes" />
            <QuickAction label={t('technician_partner_dashboard.quick_actions.service_pricing')} href="/vehicle-issues/service-pricing" />
        </section>

        <section className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🚧 {t('technician_partner_dashboard.assigned_issues')}</h2>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {issues.map(issue => (
              <div key={issue.id} className="border rounded-xl p-4 bg-white shadow">
                <div className="text-sm font-semibold mb-2">
                  {getTranslatedIssueType(issue.issueType)} – {renderStatusBadge(issue.status, t)}
                </div>
                <p className="text-sm text-gray-600"><strong>VIN:</strong> {issue.vin}</p>
                <p className="text-sm text-gray-600"><strong>{t('technician_partner_dashboard.table_headers.plate')}:</strong> {issue.plateNumber}</p>
                <p className="text-sm text-gray-600"><strong>{t('technician_partner_dashboard.table_headers.description')}:</strong> {issue.description}</p>
                <p className="text-sm text-gray-600"><strong>{t('technician_partner_dashboard.table_headers.reported')}:</strong> {issue.reportedAt?.toDate().toLocaleString()}</p>
                <div className="mt-3 space-y-2">
                  {issue.status === 'assigned' && <Button className="w-full" onClick={() => setProposingIssue(issue)}>{t('technician_partner_dashboard.submit_proposal')}</Button>}
                  {issue.status === 'confirmed' && <Button className="w-full" onClick={() => handleUpdateStatus(issue, 'in_progress')}>{t('technician_partner_dashboard.mark_in_progress')}</Button>}
                  {issue.status === 'in_progress' && <Button className="w-full" onClick={() => setUpdatingActualIssue(issue)}>{t('technician_partner_dashboard.submit_actual')}</Button>}
                  {issue.status === 'proposed' && <span className="text-green-600 block text-center">{t('technician_partner_dashboard.waiting_approval')}</span>}
                  {issue.status === 'rejected' && <span className="text-gray-400 italic block text-center">{t('technician_partner_dashboard.no_actions')}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">VIN</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.plate')}</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.issue_type')}</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.description')}</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.status')}</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.reported')}</th>
                  <th className="p-2">{t('technician_partner_dashboard.table_headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{issue.vin}</td>
                    <td className="p-2">{issue.plateNumber}</td>
                    <td className="p-2">{getTranslatedIssueType(issue.issueType)}</td>
                    <td className="p-2">{issue.description}</td>
                    <td className="p-2">{renderStatusBadge(issue.status, t)}</td>
                    <td className="p-2">{issue.reportedAt?.toDate().toLocaleString()}</td>
                    <td className="p-2 space-y-1">
                      {issue.status === 'assigned' && <Button onClick={() => setProposingIssue(issue)}>{t('technician_partner_dashboard.submit_proposal')}</Button>}
                      {issue.status === 'confirmed' && <Button onClick={() => handleUpdateStatus(issue, 'in_progress')}>{t('technician_partner_dashboard.mark_in_progress')}</Button>}
                      {issue.status === 'in_progress' && <Button onClick={() => setUpdatingActualIssue(issue)}>{t('technician_partner_dashboard.submit_actual')}</Button>}
                      {issue.status === 'proposed' && <span className="text-green-600">{t('technician_partner_dashboard.waiting_approval')}</span>}
                      {issue.status === 'rejected' && <span className="text-gray-400 italic">{t('technician_partner_dashboard.no_actions')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
      <NotificationDialog open={!!notification} type="success" title={t('notification.success')} description={notification || undefined} onClose={() => setNotification(null)} />
      <ProposalPopup open={!!proposingIssue} onClose={() => setProposingIssue(null)} onSubmit={handlePropose} />
      <ActualResultPopup open={!!updatingActualIssue} onClose={() => setUpdatingActualIssue(null)} onSubmit={handleActualSubmit} />
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
    <Link href={href} className="min-w-[160px] text-sm block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-4 py-3 rounded-xl transition">
      {label}
    </Link>
  );
}