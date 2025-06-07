'use client';

import { useState, useEffect } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Card, CardContent } from '@/src/components/ui/card';
import { Bike, DollarSign, FileText, Wrench, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function StationManagerDashboard() {
  const { stationId } = useUser();
  const [ebikeCount, setEbikeCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [accessoryCount, setAccessoryCount] = useState(0); // ✅ Accessories

  useEffect(() => {
    if (!stationId) return;

    const fetchData = async () => {
      // eBikes
      const ebikeSnap = await getDocs(query(collection(db, 'ebikes'), where('stationId', '==', stationId)));
      setEbikeCount(ebikeSnap.size);

      // Bookings
      const bookingSnap = await getDocs(query(collection(db, 'bookings'), where('stationId', '==', stationId)));
      const bookings = bookingSnap.docs.map(doc => doc.data());

      const now = new Date();
      const monthlyBookings = bookings.filter((b: any) => {
        const date = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      });

      setBookingCount(monthlyBookings.length);
      setRevenue(monthlyBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0));

      // Issues
      const issueSnap = await getDocs(query(collection(db, 'vehicleIssues'), where('stationId', '==', stationId)));
      setIssueCount(issueSnap.size);

      // Accessories
      const accessorySnap = await getDocs(query(collection(db, 'accessories'), where('stationId', '==', stationId)));
      setAccessoryCount(accessorySnap.size);
    };

    fetchData();
  }, [stationId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold text-center">🏬 Station Manager Dashboard</h1>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DashboardCard icon={<Bike />} title="eBikes" value={ebikeCount} href="/ebikeManagement" />
          <DashboardCard icon={<DollarSign />} title="Revenue (This Month)" value={formatCurrency(revenue)} href="/bookings" />
          <DashboardCard icon={<FileText />} title="Bookings" value={bookingCount} href="/bookings" />
          <DashboardCard icon={<Wrench />} title="Vehicle Issues" value={issueCount} href="/vehicle-issues" />
          <DashboardCard icon={<PackagePlus />} title="Accessories" value={accessoryCount} href="/accessories" /> {/* ✅ */}
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
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-2">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-lg font-bold text-gray-800">{value}</h3>
      </div>
    </Link>
  );
}
