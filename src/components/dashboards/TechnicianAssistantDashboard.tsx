'use client';

import { JSX, useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import { ClipboardList, FileText, Wrench } from 'lucide-react';

import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

type PartnerStats = {
  mobile: number;
  shop: number;
  active: number;
  inactive: number;
  total: number;
};

export default function TechnicianAssistantDashboard() {
  const { user } = useUser();
  const { t } = useTranslation('common', { keyPrefix: 'technician_dashboard' });

  const [stats, setStats] = useState({
    unassignedIssues: 0,
    assignedToday: 0,
    partners: { mobile: 0, shop: 0, active: 0, inactive: 0, total: 0 } as PartnerStats,
  });

  // Helper: convert mọi kiểu (Timestamp | number | string) -> Date | null
  const toDateSafe = (v: any): Date | null => {
    if (!v) return null;
    if (typeof v?.toDate === 'function') return v.toDate(); // Firestore Timestamp
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  useEffect(() => {
    if (!user?.uid) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const fetchStats = async () => {
      try {
        // ---------- Public issues (1 lần fetch) ----------
        const issuesSnap = await getDocs(collection(db, 'publicVehicleIssues'));
        const issues: PublicVehicleIssue[] = issuesSnap.docs.map((d) => d.data() as PublicVehicleIssue);

        const unassignedIssuesCount = issues.filter(
          (it) => it.status === 'pending' && !it.assignedTo
        ).length;

        const assignedTodayCount = issues.filter((it) => {
          if (it.assignedBy !== user.uid) return false;
          const dt = toDateSafe(it.assignedAt);
          return !!dt && dt >= todayStart;
        }).length;

        // ---------- Technician Partners ----------
        const partnersSnap = await getDocs(collection(db, 'technicianPartners'));
        const total = partnersSnap.size;
        let mobile = 0, shop = 0, active = 0;

        partnersSnap.docs.forEach((doc) => {
          const p = doc.data() as any;
          if (p?.type === 'mobile') mobile += 1;
          if (p?.type === 'shop') shop += 1;
          if (p?.isActive === true) active += 1;
        });
        const inactive = total - active;

        setStats({
          unassignedIssues: unassignedIssuesCount,
          assignedToday: assignedTodayCount,
          partners: { mobile, shop, active, inactive, total },
        });
      } catch (err) {
        console.error('Error fetching stats for technician assistant:', err);
      }
    };

    fetchStats();
  }, [user?.uid]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-2 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          {t('title')}
        </h1>

        {/* Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <DashboardCard
            icon={<ClipboardList aria-hidden className="w-5 h-5" />}
            title={t('cards.unassigned_issues')}
            value={stats.unassignedIssues}   // ✅ lấy từ publicVehicleIssues (pending + chưa assignedTo)
            href="/assistant/dispatch"
          />

          {/* Mobile / Shop */}
          <DashboardCard
            icon={<Wrench aria-hidden className="w-5 h-5" />}
            title={t('cards.partners_by_type')}
            value={`${stats.partners.mobile} / ${stats.partners.shop}`}
            hint={t('cards.hint.mobile_shop')}
            href="/assistant/add-technician-partner"
          />

          {/* Active / Inactive */}
          <DashboardCard
            icon={<Wrench aria-hidden className="w-5 h-5" />}
            title={t('cards.partners_by_status')}
            value={`${stats.partners.active} / ${stats.partners.inactive}`}
            hint={t('cards.hint.active_inactive')}
            href="/assistant/add-technician-partner"
          />

          <DashboardCard
            icon={<FileText aria-hidden className="w-5 h-5" />}
            title={t('cards.assigned_today')}
            value={stats.assignedToday}      // ✅ lấy từ publicVehicleIssues (assignedBy = bạn & assignedAt >= hôm nay)
            href="/assistant/dispatch"
          />
        </section>

        <section className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">{t('quick_actions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <QuickAction label={t('quick.dispatch')} href="/assistant/dispatch" />
            <QuickAction label={t('quick.error_codes')} href="/vehicle-issues/error-codes" />
            <QuickAction label={t('quick.service_pricing')} href="/vehicle-issues/service-pricing" />
            <QuickAction label={t('quick.add_partner')} href="/assistant/add-technician-partner" />
            <QuickAction label={t('quick.report_issue')} href="/assistant/report-public-issue" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  href,
  hint,
}: {
  icon: JSX.Element;
  title: string;
  value: string | number;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-3 sm:p-4 rounded-xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-3 sm:gap-4"
    >
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-2 sm:p-3 w-10 h-10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-500">{title}</p>
        <h3 className="text-base sm:text-lg font-bold text-gray-800">{value}</h3>
        {hint && <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </Link>
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
