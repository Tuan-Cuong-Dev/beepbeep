'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import {
  Bike,
  FileText,
  LineChart,
  Star,
  Wrench,
  ClipboardList,
  PackagePlus,
} from 'lucide-react';

interface DashboardStats {
  ebikes: number;
  issues: number;
  accessories: number;
}

export default function PrivateProviderDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    ebikes: 0,
    issues: 0,
    accessories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      const companySnap = await getDocs(
        query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
      );
      if (companySnap.empty) return;

      const companyId = companySnap.docs[0].id;

      const ebikeSnap = await getDocs(
        query(collection(db, 'ebikes'), where('companyId', '==', companyId))
      );
      const issuesSnap = await getDocs(
        query(collection(db, 'vehicleIssues'), where('companyId', '==', companyId))
      );
      const accessoriesSnap = await getDocs(
        query(collection(db, 'accessories'), where('companyId', '==', companyId))
      );

      setStats({
        ebikes: ebikeSnap.size,
        issues: issuesSnap.size,
        accessories: accessoriesSnap.size,
      });

      setLoading(false);
    };

    fetchStats();
  }, [user]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">🚴 Private Provider Dashboard</h1>

        <DashboardGrid>
          <DashboardCard
            title="My eBikes"
            value={stats.ebikes.toString()}
            href="/ebikes"
            icon={<Bike className="w-6 h-6" />}
          />
          <DashboardCard
            title="Vehicle Issues"
            value={stats.issues.toString()}
            href="/vehicle-issues"
            icon={<Wrench className="w-6 h-6" />}
          />
          <DashboardCard
            title="Accessories"
            value={stats.accessories.toString()}
            href="/accessories"
            icon={<PackagePlus className="w-6 h-6" />}
          />
          <DashboardCard
            title="Ratings & Reviews"
            value="4.7/5"
            href="/reviews"
            icon={<Star className="w-6 h-6" />}
          />
          <DashboardCard
            title="Earnings Overview"
            value="$1,280"
            href="/reports"
            icon={<LineChart className="w-6 h-6" />}
          />
          <DashboardCard
            icon={<ClipboardList className="w-6 h-6" />}
            title="Programs"
            value="Manage"
            href="/my-business/programs"
          />
        </DashboardGrid>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <QuickAction label="Add New eBike" href="/ebikes" />
            <QuickAction label="Check Reviews" href="/reviews" />
            <QuickAction label="Form Builder" href="/my-business/form-builder" />
            <QuickAction label="View Reports" href="/reports" />
            <QuickAction label="Manage Vehicle Issues" href="/vehicle-issues" />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Recent Activity</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <RecentActivityItem text='eBike "VN-0123" marked as available' />
            <RecentActivityItem text="New customer review received" />
            <RecentActivityItem text='Maintenance log updated for eBike "VN-0088"' />
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DashboardGrid({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</section>;
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
