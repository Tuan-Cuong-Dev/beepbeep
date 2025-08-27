'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { useUser } from '@/src/context/AuthContext';
import { usePublicIssuesToDispatch } from '@/src/hooks/usePublicIssuesToDispatch';
import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

import ProposalPopup from '@/src/components/public-vehicle-issues/ProposalPopup';
import ActualResultPopup from '@/src/components/public-vehicle-issues/ActualResultPopup';
import PublicIssueTable from '@/src/components/public-vehicle-issues/PublicIssueTable';

import { Wrench, ClipboardList, CheckCircle, AlertTriangle, Satellite } from 'lucide-react';
import Link from 'next/link';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

/** ✅ Toggle theo dõi vị trí (card desktop) */
import TrackerToggle from '@/src/components/techinicianPartner/TrackerToggle';
/** ✅ Sticky bar cho mobile (nút to, dễ bấm) */
import MobileStickyTrackerBar from '@/src/components/techinicianPartner/MobileStickyTrackerBar';

export default function TechnicianPartnerDashboard() {
  const { t } = useTranslation('common');
  const { user, role, loading: userLoading } = useUser();
  const normalizedRole = role?.toLowerCase();
  const isPartner = normalizedRole === 'technician_partner';

  const { issues, loading: issuesLoading, updateIssue } = usePublicIssuesToDispatch();

  // Popup states
  const [notification, setNotification] = useState<string | null>(null);
  const [proposingIssue, setProposingIssue] = useState<PublicVehicleIssue | null>(null);
  const [updatingActualIssue, setUpdatingActualIssue] = useState<PublicVehicleIssue | null>(null);

  // Chỉ lấy issues được giao cho kỹ thuật viên hiện tại
  const myIssues = useMemo(
    () => issues.filter((i) => i.assignedTo === user?.uid),
    [issues, user?.uid]
  );

  // Đếm theo trạng thái cho summary cards
  const counts = useMemo(() => {
    const init: Record<PublicIssueStatus, number> = {
      pending: 0,
      assigned: 0,
      proposed: 0,
      confirmed: 0,
      rejected: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    for (const it of myIssues) init[it.status] = (init[it.status] ?? 0) + 1;
    return init;
  }, [myIssues]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  if (!user || userLoading) {
    return <div className="text-center py-10">🔎 {t('technician_partner_dashboard.checking_permission')}</div>;
  }
  if (!isPartner) {
    return <div className="text-center py-10 text-red-500">🚫 {t('technician_partner_dashboard.only_for_technician_partner')}</div>;
  }
  if (issuesLoading) {
    return <div className="text-center py-10">⏳ {t('technician_partner_dashboard.loading_issues')}</div>;
  }

  // Handlers cho popup
  const handlePropose = async (solution: string, cost: number) => {
    if (!proposingIssue?.id) return;
    await updateIssue(proposingIssue.id, {
      status: 'proposed',
      proposedSolution: solution,
      proposedCost: cost,
    });
    setNotification(t('technician_partner_dashboard.proposal_submitted'));
    setProposingIssue(null);
  };

  const handleActualSubmit = async (solution: string, cost: number) => {
    if (!updatingActualIssue?.id) return;
    await updateIssue(updatingActualIssue.id, {
      status: 'resolved',
      actualSolution: solution,
      actualCost: cost,
    });
    setNotification(t('technician_partner_dashboard.actual_result_submitted'));
    setUpdatingActualIssue(null);
  };

  // No-op cho các prop admin không dùng
  const noop = () => {};
  const noopIssue = (_: PublicVehicleIssue | null) => {};
  const noopBool = (_: boolean) => {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 space-y-10 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          🛠️ {t('technician_partner_dashboard.title')}
        </h1>

        {/* ✅ Live Tracking
            - Desktop: hiển thị card đẹp + TrackerToggle
            - Mobile: card ẩn, dùng Sticky bar cố định dưới (render ở cuối trang) */}
        <section className="hidden sm:block bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#e6fff5] text-[#00d289]">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {t('admin_live_map_page.map.title')}
                </h2>
                <p className="text-xs text-gray-500">
                  {t('tech_tracker_hint')}
                </p>
              </div>
            </div>
          </div>

          {/* Nút bật/tắt tracking (desktop) */}
          <div className="flex items-center">
            <TrackerToggle />
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard
            icon={<ClipboardList />}
            title={t('technician_partner_dashboard.summary.assigned')}
            value={String(counts.assigned)}
          />
          <DashboardCard
            icon={<AlertTriangle />}
            title={t('technician_partner_dashboard.summary.proposed')}
            value={String(counts.proposed)}
          />
          <DashboardCard
            icon={<Wrench />}
            title={t('technician_partner_dashboard.summary.in_progress')}
            value={String(counts.in_progress)}
          />
          <DashboardCard
            icon={<CheckCircle />}
            title={t('technician_partner_dashboard.summary.resolved')}
            value={String(counts.resolved)}
          />
        </section>

        {/* Lối tắt */}
        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <QuickAction label={t('technician_partner_dashboard.quick_actions.my_issues')} href="/public-vehicle-issues" />
          <QuickAction label={t('technician_partner_dashboard.quick_actions.proposal_history')} href="/proposed" />
          <QuickAction label={t('technician_partner_dashboard.quick_actions.suggest_error_fix')} href="/vehicle-issues/suggest-error" />
          <QuickAction label={t('technician_partner_dashboard.quick_actions.error_codes')} href="/vehicle-issues/error-codes" />
          <QuickAction label={t('technician_partner_dashboard.quick_actions.service_pricing')} href="/vehicle-issues/service-pricing" />
        </section>

        {/* Bảng/Thẻ sự cố — dùng component chuẩn */}
        <section className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🚧 {t('technician_partner_dashboard.assigned_issues')}
          </h2>

          <PublicIssueTable
            issues={myIssues}
            onEdit={noopIssue}
            updateIssue={updateIssue}
            setClosingIssue={noopIssue}
            setCloseDialogOpen={noopBool}
            setEditingIssue={noopIssue}
            setShowForm={noopBool}
            normalizedRole={normalizedRole || ''}
            isAdmin={false}
            isTechnician
            setProposingIssue={setProposingIssue}
            setUpdatingActualIssue={setUpdatingActualIssue}
            setViewingProposal={noopIssue}
            setApprovingProposal={noopIssue}
          />
        </section>
      </main>

      <Footer />

      {/* 🔔 Notification */}
      <NotificationDialog
        open={!!notification}
        type="success"
        title={t('notification.success')}
        description={notification || undefined}
        onClose={() => setNotification(null)}
      />

      {/* 🧩 Popup nộp đề xuất & kết quả thực tế */}
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

      {/* 📌 Sticky tracker bar chỉ mobile (tránh ghi trùng với card) */}
      <MobileStickyTrackerBar className="sm:hidden" />
    </div>
  );
}

/* ===== Presentational bits ===== */
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
    <Link
      href={href}
      className="block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-4 py-3 rounded-xl transition"
    >
      {label}
    </Link>
  );
}
