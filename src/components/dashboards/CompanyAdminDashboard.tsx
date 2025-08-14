'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import {
  MapPin,
  Bike,
  DollarSign,
  Users,
  FileText,
  PackagePlus,
  ClipboardList,
  BatteryCharging,
  Boxes,
  Wrench,
  User, // ✅ icon cho Customers
} from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { JSX } from 'react/jsx-runtime';
import { useTranslation } from 'react-i18next';

export default function CompanyAdminDashboard() {
  const { t } = useTranslation('common');
  const { companyId } = useUser();

  const [stats, setStats] = useState({
    stations: 0,
    ebikes: 0,
    staffs: 0,
    bookings: 0,
    accessories: 0,
    batteries: 0,
    revenue: 0,
    subscriptionPackages: 0,
    vehicleIssues: 0,
    customers: 0, // ✅ thêm
    programs: 0,  // ✅ thêm
  });

  useEffect(() => {
    if (!companyId) {
      console.warn('❌ Missing companyId. Aborting fetch.');
      return;
    }

    const fetchStats = async () => {
      try {
        const queries = {
          stations: query(collection(db, 'rentalStations'), where('companyId', '==', companyId)),
          ebikes: query(collection(db, 'ebikes'), where('companyId', '==', companyId)),
          staffs: query(collection(db, 'staffs'), where('companyId', '==', companyId)),
          bookings: query(collection(db, 'bookings'), where('companyId', '==', companyId)),
          accessories: query(collection(db, 'accessories'), where('companyId', '==', companyId)),
          batteries: query(collection(db, 'batteries'), where('companyId', '==', companyId)),
          subscriptionPackages: query(collection(db, 'subscriptionPackages'), where('companyId', '==', companyId)),
          vehicleIssues: query(collection(db, 'vehicleIssues'), where('companyId', '==', companyId)),
          customers: query(collection(db, 'customers'), where('companyId', '==', companyId)),    // ✅ thêm
          programs: query(collection(db, 'programs'), where('companyId', '==', companyId)),      // ✅ thêm (đổi tên collection nếu bạn dùng khác)
        };

        const [
          stationSnap,
          ebikeSnap,
          staffSnap,
          bookingSnap,
          accessorySnap,
          batterySnap,
          packageSnap,
          issueSnap,
          customerSnap, // ✅
          programSnap,  // ✅
        ] = await Promise.all([
          getDocs(queries.stations),
          getDocs(queries.ebikes),
          getDocs(queries.staffs),
          getDocs(queries.bookings),
          getDocs(queries.accessories),
          getDocs(queries.batteries),
          getDocs(queries.subscriptionPackages),
          getDocs(queries.vehicleIssues),
          getDocs(queries.customers), // ✅
          getDocs(queries.programs),  // ✅
        ]);

        const bookings = bookingSnap.docs.map(doc => doc.data());
        const now = new Date();

        const monthlyBookings = bookings.filter((b: any) => {
          const date = b.createdAt?.toDate?.() || (b.createdAt ? new Date(b.createdAt) : null);
          return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        });

        const revenue = monthlyBookings.reduce((sum, b) => sum + (typeof b.totalAmount === 'number' ? b.totalAmount : 0), 0);

        setStats({
          stations: stationSnap.size,
          ebikes: ebikeSnap.size,
          staffs: staffSnap.size,
          bookings: monthlyBookings.length,
          accessories: accessorySnap.size,
          batteries: batterySnap.size,
          revenue,
          subscriptionPackages: packageSnap.size,
          vehicleIssues: issueSnap.size,
          customers: customerSnap.size, // ✅
          programs: programSnap.size,   // ✅
        });
      } catch (error) {
        console.error('🔥 Unexpected error in fetchStats:', error);
      }
    };

    fetchStats();
  }, [companyId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🏢 {t('company_admin_dashboard.title')}
        </h1>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DashboardCard icon={<MapPin />} title={t('company_admin_dashboard.stations')} value={stats.stations} href="/dashboard/stations" />
          <DashboardCard icon={<Bike />} title={t('company_admin_dashboard.vehicles')} value={stats.ebikes} href="/vehicles" />

          {/* ✅ Customers card */}
          <DashboardCard icon={<User />} title={t('company_admin_dashboard.customers')} value={stats.customers} href="/customers" />

          <DashboardCard icon={<DollarSign />} title={t('company_admin_dashboard.revenue_this_month')} value={formatCurrency(stats.revenue)} href="/bookings" />
          <DashboardCard icon={<Users />} title={t('company_admin_dashboard.staff')} value={stats.staffs} href="/dashboard/staff" />
          <DashboardCard icon={<FileText />} title={t('company_admin_dashboard.bookings')} value={stats.bookings} href="/bookings" />
          <DashboardCard icon={<PackagePlus />} title={t('company_admin_dashboard.accessories')} value={stats.accessories} href="/accessories" />
          <DashboardCard icon={<BatteryCharging />} title={t('company_admin_dashboard.batteries')} value={stats.batteries} href="/battery" />

          {/* ✅ Programs hiển thị số lượng thay vì "Quản lý" */}
          <DashboardCard icon={<ClipboardList />} title={t('company_admin_dashboard.programs')} value={stats.programs} href="/dashboard/programs" />

          <DashboardCard icon={<Boxes />} title={t('company_admin_dashboard.subscription_packages')} value={stats.subscriptionPackages} href="/subscriptionPackages" />
          <DashboardCard icon={<Wrench />} title={t('company_admin_dashboard.vehicle_issues')} value={stats.vehicleIssues} href="/vehicle-issues" />
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ {t('company_admin_dashboard.quick_actions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <QuickAction label={t('company_admin_dashboard.add_new_station')} href="/dashboard/stations" />
            <QuickAction label={t('company_admin_dashboard.create_vehicle_model')} href="/vehicles" />
            <QuickAction label={t('company_admin_dashboard.assign_staff')} href="/dashboard/staff" />
            <QuickAction label={t('company_admin_dashboard.form_builder')} href="/dashboard/form-builder" />
            <QuickAction label={t('company_admin_dashboard.rent_a_ride')} href="/rent" />
            <QuickAction label={t('company_admin_dashboard.return_vehicle')} href="/return" />
            <QuickAction label={t('company_admin_dashboard.report_vehicle_issue')} href="/vehicle-issues/report" />
            <QuickAction label={t('company_admin_dashboard.manage_subscription_packages')} href="/subscriptionPackages" />
            <QuickAction label={t('company_admin_dashboard.view_vehicle_issues')} href="/vehicle-issues" />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 {t('company_admin_dashboard.recent_activity')}</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <RecentActivityItem text={t('company_admin_dashboard.activity_new_booking', { name: 'Jane Smith' })} />
            <RecentActivityItem text={t('company_admin_dashboard.activity_station_added', { name: 'Hai Chau Branch' })} />
            <RecentActivityItem text={t('company_admin_dashboard.activity_vehicle_under_maintenance', { vehicle: 'DE1023' })} />
          </ul>
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
}: {
  icon: JSX.Element;
  title: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-4"
    >
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-3 w-10 h-10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-lg font-bold text-gray-800">{value}</h3>
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

function RecentActivityItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <FileText className="mt-0.5 w-4 h-4 text-[#00d289]" />
      <span>{text}</span>
    </li>
  );
}
