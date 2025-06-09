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
} from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function CompanyAdminDashboard() {
  const { companyId } = useUser();

  const [stats, setStats] = useState({
    stations: 0,
    ebikes: 0,
    staffs: 0,
    bookings: 0,
    accessories: 0,
    batteries: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!companyId) {
      console.warn('❌ Missing companyId. Aborting fetch.');
      return;
    }

    console.log('🔍 Fetching stats for companyId:', companyId);

    const fetchStats = async () => {
      try {
        const queries = {
          stations: query(collection(db, 'rentalStations'), where('companyId', '==', companyId)),
          ebikes: query(collection(db, 'ebikes'), where('companyId', '==', companyId)),
          staffs: query(collection(db, 'staffs'), where('companyId', '==', companyId)),
          bookings: query(collection(db, 'bookings'), where('companyId', '==', companyId)),
          accessories: query(collection(db, 'accessories'), where('companyId', '==', companyId)),
          batteries: query(collection(db, 'batteries'), where('companyId', '==', companyId)),
        };

        const [
          stationSnap,
          ebikeSnap,
          staffSnap,
          bookingSnap,
          accessorySnap,
          batterySnap,
        ] = await Promise.all([
          getDocs(queries.stations).catch(e => { console.error('❌ rentalStations:', e); return { size: 0, docs: [] }; }),
          getDocs(queries.ebikes).catch(e => { console.error('❌ ebikes:', e); return { size: 0, docs: [] }; }),
          getDocs(queries.staffs).catch(e => { console.error('❌ staffs:', e); return { size: 0, docs: [] }; }),
          getDocs(queries.bookings).catch(e => { console.error('❌ bookings:', e); return { size: 0, docs: [] }; }),
          getDocs(queries.accessories).catch(e => { console.error('❌ accessories:', e); return { size: 0, docs: [] }; }),
          getDocs(queries.batteries).catch(e => { console.error('❌ batteries:', e); return { size: 0, docs: [] }; }),
        ]);

        const bookings = bookingSnap.docs.map(doc => doc.data());
        const now = new Date();

        const monthlyBookings = bookings.filter((b: any) => {
          const date = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        });

        const revenue = monthlyBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        setStats({
          stations: stationSnap.size,
          ebikes: ebikeSnap.size,
          staffs: staffSnap.size,
          bookings: monthlyBookings.length,
          accessories: accessorySnap.size,
          batteries: batterySnap.size,
          revenue,
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
          🏢 Company Admin Dashboard
        </h1>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DashboardCard icon={<MapPin />} title="Stations" value={stats.stations} href="/my-business/stations" />
          <DashboardCard icon={<Bike />} title="eBikes" value={stats.ebikes} href="/vehicles" />
          <DashboardCard icon={<DollarSign />} title="Revenue (This Month)" value={formatCurrency(stats.revenue)} href="/bookings" />
          <DashboardCard icon={<Users />} title="Staff" value={stats.staffs} href="/my-business/staff" />
          <DashboardCard icon={<FileText />} title="Bookings" value={stats.bookings} href="/bookings" />
          <DashboardCard icon={<PackagePlus />} title="Accessories" value={stats.accessories} href="/accessories" />
          <DashboardCard icon={<BatteryCharging />} title="Batteries" value={stats.batteries} href="/battery" />
          <DashboardCard icon={<ClipboardList />} title="Programs" value="Manage" href="/my-business/programs" />
        </section>

        {/* ✅ Quick Actions - GIỮ NGUYÊN */}
        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <QuickAction label="Add New Station" href="/my-business/stations" />
            <QuickAction label="Create Vehicle Model" href="/vehicles" />
            <QuickAction label="Assign Staff" href="/my-business/staff" />
            <QuickAction label="Form Builder" href="/my-business/form-builder" />
            <QuickAction label="Upload Invoice" href="/my-business/documents" />
            <QuickAction label="View Reports" href="/reports" />
          </div>
        </section>

        {/* ✅ Recent Activity - GIỮ NGUYÊN */}
        <section className="bg-white rounded-2xl p-6 border shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Recent Activity</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <RecentActivityItem text="New booking received from Jane Smith" />
            <RecentActivityItem text='Station "Hai Chau Branch" added' />
            <RecentActivityItem text='Vehicle "DE1023" marked as under maintenance' />
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// DashboardCard, QuickAction, RecentActivityItem giữ nguyên như bạn đã viết


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
