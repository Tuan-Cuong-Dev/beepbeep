'use client';

import { JSX, useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Link from 'next/link';
import {
  Handshake,
  Users,
  DollarSign,
  FileText,
  BarChart2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActivityLog {
  bookingId: string;
  commission: number;
}

interface DashboardData {
  referrals: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  activity: ActivityLog[];
  paymentRequests: number;
}

export default function AgentDashboard() {
  const { t } = useTranslation("common");
  const { user } = useUser();
  const [data, setData] = useState<DashboardData>({
    referrals: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    activity: [],
    paymentRequests: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const bookingsQuery = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
      const bookingsSnap = await getDocs(bookingsQuery);

      let total = 0, paid = 0, pending = 0;
      const logs: ActivityLog[] = [];

      bookingsSnap.forEach((doc) => {
        const booking = doc.data();
        const amount = booking.agentCommission || 0;
        total += amount;
        if (booking.agentCommissionPaid) paid += amount;
        else pending += amount;

        logs.push({
          bookingId: doc.id,
          commission: amount,
        });
      });

      const requestQuery = query(collection(db, 'paymentRequests'), where('agentId', '==', user.uid));
      const requestSnap = await getDocs(requestQuery);

      setData({
        referrals: bookingsSnap.size,
        totalCommission: total,
        paidCommission: paid,
        pendingCommission: pending,
        activity: logs.slice(0, 5),
        paymentRequests: requestSnap.size,
      });
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🤝 {t("agent_dashboard.title")}
        </h1>

        <DashboardGrid>
          <DashboardCard
            title={t("agent_dashboard.referrals")}
            value={data.referrals.toString()}
            href="#"
            icon={<Users className="w-6 h-6" />}
          />
          <DashboardCard
            title={t("agent_dashboard.total_commission")}
            value={`$${data.totalCommission.toLocaleString()}`}
            href="#"
            icon={<DollarSign className="w-6 h-6" />}
          />
          <DashboardCard
            title={t("agent_dashboard.paid_commission")}
            value={`$${data.paidCommission.toLocaleString()}`}
            href="#"
            icon={<DollarSign className="w-6 h-6" />}
          />
          <DashboardCard
            title={t("agent_dashboard.pending_commission")}
            value={`$${data.pendingCommission.toLocaleString()}`}
            href="#"
            icon={<DollarSign className="w-6 h-6" />}
          />
          <DashboardCard
            title={t("agent_dashboard.join_new_program")}
            value={t("agent_dashboard.available")}
            href="/dashboard/programs"
            icon={<Handshake className="w-6 h-6" />}
          />
          <DashboardCard
            title={t("agent_dashboard.payment_requests")}
            value={`${data.paymentRequests} ${t("agent_dashboard.times")}`}
            href="/dashboard/earnings"
            icon={<BarChart2 className="w-6 h-6" />}
          />
        </DashboardGrid>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ⚡ {t("agent_dashboard.quick_actions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <QuickAction label={t("agent_dashboard.refer_customer")} href="#" />
            <QuickAction label={t("agent_dashboard.view_commission_history")} href="/dashboard/earnings" />
            <QuickAction label={t("agent_dashboard.join_new_program")} href="/dashboard/programs" />
            {data.pendingCommission > 0 && (
              <QuickAction label={t("agent_dashboard.request_payment")} href="/dashboard/request-payment" />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DashboardGrid({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">{children}</section>;
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
