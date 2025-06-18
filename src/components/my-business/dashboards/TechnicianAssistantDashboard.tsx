'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import {
  ClipboardList,
  FileText,
  Wrench,
} from 'lucide-react';

export default function TechnicianAssistantDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    unassignedIssues: 0,
    technicians: 0,
    assignedToday: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const fetchStats = async () => {
      try {
        // ✅ Lấy toàn bộ vehicleIssues để lọc assignedTo == null client-side
        const allIssuesSnap = await getDocs(collection(db, 'vehicleIssues'));
        const unassignedIssuesCount = allIssuesSnap.docs.filter((doc) => {
          const data = doc.data();
          return data.status === 'pending' && (data.assignedTo === null || data.assignedTo === undefined);
        }).length;

        const q2 = query(
          collection(db, 'staffs'),
          where('role', '==', 'technician')
        );

        const q3 = query(
          collection(db, 'vehicleIssues'),
          where('assignedBy', '==', user.uid),
          where('assignedAt', '>=', todayStart)
        );

        const [snap2, snap3] = await Promise.all([
          getCountFromServer(q2),
          getCountFromServer(q3),
        ]);

        setStats({
          unassignedIssues: unassignedIssuesCount,
          technicians: snap2.data().count,
          assignedToday: snap3.data().count,
        });
      } catch (err) {
        console.error('Error fetching Technician Assistant stats:', err);
      }
    };

    fetchStats();
  }, [user?.uid]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🛠️ Technician Assistant Dashboard
        </h1>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            icon={<ClipboardList />}
            title="Unassigned Issues"
            value={stats.unassignedIssues}
            href="/assistant/dispatch"
          />
          <DashboardCard
            icon={<Wrench />}
            title="Technicians"
            value={stats.technicians}
            href="/my-business/staff"
          />
          <DashboardCard
            icon={<FileText />}
            title="Assigned Today"
            value={stats.assignedToday}
            href="/assistant/dispatch"
          />
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <QuickAction label="Dispatch Issues" href="/assistant/dispatch" />
            <QuickAction label="Manage Error Codes" href="/assistant/error-codes" />
            <QuickAction label="Service Pricing" href="/assistant/service-pricing" />
            <QuickAction label="Add Technician" href="/assistant/add-technician" />
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
