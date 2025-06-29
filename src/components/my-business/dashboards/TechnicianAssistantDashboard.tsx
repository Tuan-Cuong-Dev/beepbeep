'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
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
    technicianPartners: 0,
    assignedToday: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const fetchStats = async () => {
      try {
        // 🔍 Tải toàn bộ vehicleIssues
        const allIssuesSnap = await getDocs(collection(db, 'vehicleIssues'));

        // Đếm các sự cố chưa được gán
        const unassignedIssuesCount = allIssuesSnap.docs.filter((doc) => {
          const data = doc.data();
          return data.status === 'pending' && !data.assignedTo;
        }).length;

        // Đếm số sự cố được gán bởi technician_assistant hôm nay
        const assignedTodayCount = allIssuesSnap.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.assignedBy === user.uid &&
            data.assignedAt?.toDate?.() >= todayStart
          );
        }).length;

        // Đếm số technician_partner đang hoạt động
        const partnerSnap = await getCountFromServer(
          query(collection(db, 'technicianPartners'), where('isActive', '==', true))
        );

        setStats({
          unassignedIssues: unassignedIssuesCount,
          technicianPartners: partnerSnap.data().count,
          assignedToday: assignedTodayCount,
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
            title="Technician Partners"
            value={stats.technicianPartners}
            href="/assistant/technician-partners"
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
            <QuickAction label="Add Technician Partner" href="/assistant/add-technician-partner" />
            <QuickAction label="Report Issue" href="/vehicle-issues/report" />
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
