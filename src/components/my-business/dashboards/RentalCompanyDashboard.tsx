'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import {
  DollarSign,
  Bike,
  MapPin,
  Users,
  FileText,
  Wrench,
  FileTextIcon,
  ClipboardList,
  BatteryCharging,
  Package,
} from 'lucide-react';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function RentalCompanyDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    stations: 0,
    ebikes: 0,
    bookings: 0,
    revenue: 0,
    staffs: 0,
    issues: 0,
    batteries: 0,
    accessories: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      const companySnap = await getDocs(
        query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
      );
      if (companySnap.empty) return;

      const companyId = companySnap.docs[0].id;

      const [stationSnap, ebikeSnap, staffSnap, issuesSnap, bookingsSnap, batterySnap, accessorySnap] =
        await Promise.all([
          getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'ebikes'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'staffs'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'vehicleIssues'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'bookings'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'batteries'), where('companyId', '==', companyId))),
          getDocs(query(collection(db, 'accessories'), where('companyId', '==', companyId))),
        ]);

      const bookings: Booking[] = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyBookings = bookings.filter(b => {
        try {
          const date =
            b.createdAt instanceof Date
              ? b.createdAt
              : b.createdAt?.toDate?.();
          return (
            date?.getFullYear() === currentYear &&
            date?.getMonth() === currentMonth
          );
        } catch (err) {
          console.warn('⚠️ Invalid createdAt:', b);
          return false;
        }
      });

      const totalRevenue = monthlyBookings.reduce((sum, b) => {
        const amount = typeof b.totalAmount === 'number' ? b.totalAmount : 0;
        return sum + amount;
      }, 0);

      console.log("📅 Monthly bookings:", monthlyBookings.length);
      console.log("💰 Revenue items:", monthlyBookings.map(b => b.totalAmount));

      setStats({
        stations: stationSnap.size,
        ebikes: ebikeSnap.size,
        bookings: monthlyBookings.length,
        revenue: totalRevenue,
        staffs: staffSnap.size,
        issues: issuesSnap.size,
        batteries: batterySnap.size,
        accessories: accessorySnap.size,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">🏢 Rental Company Dashboard</h1>
        <DashboardGrid1>
          <DashboardCard title="Stations" value={stats.stations.toString()} href="/my-business/stations" icon={<MapPin className="w-6 h-6" />} />
          <DashboardCard title="Vehicles" value={stats.ebikes.toString()} href="/vehicles" icon={<Bike className="w-6 h-6" />} />
          <DashboardCard title="Bookings (This Month)" value={stats.bookings.toString()} href="/bookings" icon={<FileTextIcon className="w-6 h-6" />} />
          <DashboardCard title="Revenue (This Month)" value={formatCurrency(stats.revenue)} href="/my-business/revenue" icon={<DollarSign className="w-6 h-6" />} />
          <DashboardCard icon={<ClipboardList className="w-6 h-6" />} title="Programs" value="Manage" href="/my-business/programs" />
          <DashboardCard title="Staff" value={stats.staffs.toString()} href="/my-business/staff" icon={<Users className="w-6 h-6" />} />
          <DashboardCard title="Vehicle Issues" value={stats.issues.toString()} href="/vehicle-issues" icon={<Wrench className="w-6 h-6" />} />
          <DashboardCard title="Batteries" value={stats.batteries.toString()} href="/battery" icon={<BatteryCharging className="w-6 h-6" />} />
          <DashboardCard title="Accessories" value={stats.accessories.toString()} href="/accessories" icon={<Package className="w-6 h-6" />} />
          <DashboardCard title="Subscription Packages" value="Manage" href="/subscriptionPackages" icon={<ClipboardList className="w-6 h-6" />} />
        </DashboardGrid1>

        <DashboardGrid2>
          <InfoCard title="📈 Revenue Overview">
            <p className="text-2xl font-bold">
              {formatCurrency(stats.revenue)} from {stats.bookings} bookings this month
            </p>
          </InfoCard>

          <InfoCard title="📝 Recent Activity">
            <RecentActivityItem text="New booking received from John Doe" />
            <RecentActivityItem text='Station "My Khe Beach" updated' />
            <RecentActivityItem text='Vehicle "VIN DE0183" marked as under maintenance' />
            <RecentActivityItem text='New model "EMOVE Flex" added' />
          </InfoCard>
        </DashboardGrid2>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <QuickAction label="Add New Station" href="/my-business/stations" />
            <QuickAction label="Create Vehicle Model" href="/vehicles" />
            <QuickAction label="Assign Staff" href="/my-business/staff" />
            <QuickAction label="Form Builder" href="/my-business/form-builder" />
            <QuickAction label="Rent a Ride" href="/rent" />
            <QuickAction label="Return Vehicle" href="/return" />
            <QuickAction label="Report Vehicle Issue" href="/vehicle-issues/report" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DashboardGrid1({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{children}</section>;
}

function DashboardGrid2({ children }: { children: React.ReactNode }) {
  return <section className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">{children}</section>;
}

function DashboardCard({
  title,
  value,
  href,
  icon,
}: {
  title: string;
  value: string;
  href: string;
  icon: JSX.Element;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-4"
    >
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-3 flex items-center justify-center w-10 h-10">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-lg font-bold text-gray-800">{value}</h3>
      </div>
    </Link>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border shadow space-y-2">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {children}
    </div>
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