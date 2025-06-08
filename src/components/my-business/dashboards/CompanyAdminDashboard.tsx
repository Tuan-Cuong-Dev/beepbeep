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
  Wrench,
  PackagePlus,
  ClipboardList,
} from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function CompanyAdminDashboard() {
  const { companyId } = useUser();
  const [stationCount, setStationCount] = useState(0);
  const [ebikeCount, setEbikeCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [accessoryCount, setAccessoryCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      const [stationSnap, ebikeSnap, staffSnap, bookingSnap, accessorySnap] = await Promise.all([
        getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'ebikes'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'staffs'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'bookings'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'accessories'), where('companyId', '==', companyId))),
      ]);

      setStationCount(stationSnap.size);
      setEbikeCount(ebikeSnap.size);
      setStaffCount(staffSnap.size);
      setAccessoryCount(accessorySnap.size);

      const bookings = bookingSnap.docs.map(doc => doc.data());
      const now = new Date();
      const monthlyBookings = bookings.filter((b: any) => {
        const date = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      });

      setBookingCount(monthlyBookings.length);
      setRevenue(monthlyBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0));
    };

    fetchData();
  }, [companyId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">🏢 Company Admin Dashboard</h1>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DashboardCard icon={<MapPin />} title="Stations" value={stationCount} href="/my-business/stations" />
          <DashboardCard icon={<Bike />} title="eBikes" value={ebikeCount} href="/ebikeManagement" />
          <DashboardCard icon={<DollarSign />} title="Revenue (This Month)" value={formatCurrency(revenue)} href="/bookings" />
          <DashboardCard icon={<Users />} title="Staff" value={staffCount} href="/my-business/staff" />
          <DashboardCard icon={<FileText />} title="Bookings" value={bookingCount} href="/bookings" />
          <DashboardCard icon={<PackagePlus />} title="Accessories" value={accessoryCount} href="/accessories" />
          <DashboardCard icon={<ClipboardList />} title="Programs" value="Manage" href="/my-business/programs" />
        </section>

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
