'use client';

import { JSX, useEffect, useMemo, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import Link from 'next/link';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit as qLimit,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';
import {
  Users,
  DollarSign,
  CheckCircle2,
  Clock3,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatCurrency';

/* ================= Types ================= */
interface ActivityLog {
  bookingId: string;
  commission: number;
  computedAt?: Timestamp;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
}

interface DashboardData {
  referrals: number;               // Số KH giới thiệu (unique theo phone) từ agentReferrals
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  activity: ActivityLog[];
  paymentRequests: number;
}

/* Helpers */
const normalizePhone = (p: unknown) => {
  const d = String(p || '').replace(/[^\d]/g, '');
  if (!d) return '';
  // chuẩn hoá đầu số Việt Nam đơn giản: 84xxxx -> 0xxxx
  if (d.startsWith('84') && d.length >= 9) return '0' + d.slice(2);
  return d;
};

/* ================= Component ================= */
export default function AgentDashboard() {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    referrals: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    activity: [],
    paymentRequests: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const uid = user.uid;

        // ===== ĐẾM KHÁCH GIỚI THIỆU (UNIQUE PHONE) TỪ agentReferrals =====
        const leadsQ = query(
          collection(db, 'agentReferrals'),
          where('agentId', '==', uid)
        );
        const leadsSnap = await getDocs(leadsQ);

        const uniquePhones = new Set<string>();
        leadsSnap.forEach((d) => {
          const row: any = d.data();
          const phone = normalizePhone(row?.phone);
          if (phone) uniquePhones.add(phone);
        });
        const referrals = uniquePhones.size;

        // ===== HOA HỒNG: lấy từ commissionHistory =====
        const chQ = query(
          collection(db, 'commissionHistory'),
          where('agentId', '==', uid),
          orderBy('createdAt', 'desc'),
          qLimit(200) // lấy nhanh 200 bản ghi gần nhất cho dashboard
        );
        const chSnap = await getDocs(chQ);

        let total = 0,
          paid = 0,
          pending = 0,
          approved = 0;
        const activities: ActivityLog[] = [];

        chSnap.forEach((d) => {
          const row: any = d.data();
          const amt = Number(row?.amount || 0);
          total += amt;
          if (row.status === 'paid') paid += amt;
          else if (row.status === 'approved') approved += amt;
          else if (row.status === 'pending') pending += amt;

          if (activities.length < 5) {
            activities.push({
              bookingId: row?.bookingId || d.id,
              commission: amt,
              computedAt: row?.computedAt,
              status: row?.status,
            });
          }
        });

        // ===== YÊU CẦU THANH TOÁN =====
        const reqQ = query(
          collection(db, 'paymentRequests'),
          where('agentId', '==', uid)
        );
        const reqSnap = await getDocs(reqQ);

        setData({
          referrals,
          totalCommission: total,
          paidCommission: paid,
          pendingCommission: pending,
          approvedCommission: approved,
          activity: activities,
          paymentRequests: reqSnap.size,
        });
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user?.uid]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 to-white">
      <Header />

      <main className="flex-1 px-4 md:px-6 py-8 md:py-10 space-y-8 md:space-y-10 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          🤝 {t('agent_dashboard.title')}
        </h1>

        {/* KPI Cards */}
        <DashboardGrid>
          <DashboardCard
            title={t('agent_dashboard.referrals')}
            value={data.referrals.toString()}
            href="/agent/referrals"
            icon={<Users className="w-6 h-6" />}
          />
          <DashboardCard
            title={t('agent_dashboard.total_commission')}
            value={formatCurrency(data.totalCommission)}
            href="/agent/commissions"
            icon={<DollarSign className="w-6 h-6" />}
          />
          <DashboardCard
            title={t('agent_dashboard.paid_commission')}
            value={formatCurrency(data.paidCommission)}
            href="/agent/commissions?status=paid"
            icon={<PiggyBank className="w-6 h-6" />}
          />
          <DashboardCard
            title={t('agent_dashboard.pending_commission')}
            value={formatCurrency(data.pendingCommission)}
            href="/agent/commissions?status=pending"
            icon={<Clock3 className="w-6 h-6" />}
          />
          <DashboardCard
            title={t('agent_dashboard.approved_commission') || 'Đã duyệt'}
            value={formatCurrency(data.approvedCommission)}
            href="/agent/commissions?status=approved"
            icon={<CheckCircle2 className="w-6 h-6" />}
          />
        </DashboardGrid>

        {/* Quick actions */}
        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
            ⚡ {t('agent_dashboard.quick_actions')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <QuickAction
              label={t('agent_dashboard.showcases')}
              href="/dashboard/programs/rental-programs/AgentJoinedModelsShowcase"
            />
            <QuickAction
              label={t('agent_dashboard.refer_customer')}
              href="/agent/referrals/quick"   
            />
            <QuickAction
              label={t('agent_dashboard.view_commission_history') || 'Xem lịch sử hoa hồng'}
              href="/agent/commissions"
            />
            <QuickAction
              label={t('agent_dashboard.selections') || 'Lựa chọn của tôi'}
              href="/dashboard/programs/rental-programs/AgentJoinedModelsTable"
            />
            <QuickAction
              label={t('agent_dashboard.join_new_program')}
              href="/dashboard/programs/rental-programs/AgentProgramTable"
            />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

/* ================= UI bits ================= */
function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {children}
    </section>
  );
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
      className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-3 md:gap-4"
    >
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-3 flex items-center justify-center w-10 h-10">
        {icon}
      </div>
      <div>
        <p className="text-xs md:text-sm text-gray-500">{title}</p>
        <h3 className="text-sm md:text-lg font-bold text-gray-800">{value}</h3>
      </div>
    </Link>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition"
    >
      {label}
    </Link>
  );
}
