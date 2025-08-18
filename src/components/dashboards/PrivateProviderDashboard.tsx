'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import {
  DollarSign, Bike, MapPin, Users, FileText, Wrench,
  FileTextIcon, ClipboardList, BatteryCharging, Package, User
} from 'lucide-react';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { JSX } from 'react/jsx-runtime';

export default function PrivateProviderDashboard() {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [stats, setStats] = useState({
    // Với Private Provider thường không có stations/staffs.
    ebikes: 0,
    bookings: 0,
    revenue: 0,
    issues: 0,
    batteries: 0,
    accessories: 0,
    customers: 0,
    programs: 0,
    subscriptionPackages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      // 👉 Lấy providerId từ collection privateProviders
      const providerSnap = await getDocs(
        query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
      );
      if (providerSnap.empty) return;

      const providerId = providerSnap.docs[0].id;

      const [
        ebikeSnap,
        issuesSnap,
        bookingsSnap,
        batterySnap,
        accessorySnap,
        customerSnap,
        programSnap,
        subscriptionSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'vehicles'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'vehicleIssues'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'bookings'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'batteries'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'accessories'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'customers'), where('companyId', '==', providerId))),
        getDocs(query(collection(db, 'programs'), where('companyId', '==', providerId))),     
        getDocs(query(collection(db, 'subscriptionPackages'), where('companyId', '==', providerId))),
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
        const amount = typeof (b as any).totalAmount === 'number' ? (b as any).totalAmount : 0;
        return sum + amount;
      }, 0);

      setStats({
        ebikes: ebikeSnap.size,
        bookings: monthlyBookings.length,
        revenue: totalRevenue,
        issues: issuesSnap.size,
        batteries: batterySnap.size,
        accessories: accessorySnap.size,
        customers: customerSnap.size,
        programs: programSnap.size,
        subscriptionPackages: subscriptionSnap.size,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          {/* Bạn có thể đổi key sang private_provider_dashboard.title nếu đã thêm i18n */}
          {t('rental_company_dashboard.title')}
        </h1>

        <DashboardGrid1>
          <DashboardCard title={t('rental_company_dashboard.vehicles')} value={stats.ebikes.toString()} href="/vehicles" icon={<Bike className="w-6 h-6" />} />

          {/* Customers */}
          <DashboardCard
            title={t('rental_company_dashboard.customers')}
            value={stats.customers.toString()}
            href="/customers"
            icon={<User className="w-6 h-6" />}
          />

          <DashboardCard title={t('rental_company_dashboard.bookings_this_month')} value={stats.bookings.toString()} href="/bookings" icon={<FileTextIcon className="w-6 h-6" />} />
          <DashboardCard title={t('rental_company_dashboard.revenue_this_month')} value={formatCurrency(stats.revenue)} href="/bookings" icon={<DollarSign className="w-6 h-6" />} />

          <DashboardCard
            title={t('rental_company_dashboard.programs')}
            value={stats.programs.toString()}
            href="/dashboard/programs"
            icon={<ClipboardList className="w-6 h-6" />}
          />

          <DashboardCard title={t('rental_company_dashboard.batteries')} value={stats.batteries.toString()} href="/battery" icon={<BatteryCharging className="w-6 h-6" />} />
          <DashboardCard title={t('rental_company_dashboard.accessories')} value={stats.accessories.toString()} href="/accessories" icon={<Package className="w-6 h-6" />} />

          <DashboardCard
            title={t('rental_company_dashboard.subscription_packages')}
            value={stats.subscriptionPackages.toString()}
            href="/subscriptionPackages"
            icon={<ClipboardList className="w-6 h-6" />}
          />
        </DashboardGrid1>

        <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('quick_actions.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <QuickAction label={t('quick_actions.create_vehicle_model')} href="/vehicles" />
            <QuickAction label={t('quick_actions.form_builder')} href="/dashboard/form-builder" />
            <QuickAction label={t('quick_actions.rent')} href="/rent" />
            <QuickAction label={t('quick_actions.return')} href="/return" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DashboardGrid1({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">{children}</section>;
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
