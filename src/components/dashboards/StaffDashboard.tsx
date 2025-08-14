'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Loader, Users, Building2, MapPin, Wrench, FileText } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import { JSX } from 'react/jsx-runtime';

interface StaffEntry {
  id: string;
  companyId: string;
  stationId?: string;
  role: string;
  companyName?: string;
  stationName?: string;
}

export default function StaffDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staffRoles, setStaffRoles] = useState<StaffEntry[]>([]);

  useEffect(() => {
    const fetchStaffRoles = async () => {
      if (!user?.uid) return;

      const snap = await getDocs(query(collection(db, 'staffs'), where('userId', '==', user.uid)));
      const results: StaffEntry[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const staffEntry: StaffEntry = {
          id: docSnap.id,
          companyId: data.companyId,
          stationId: data.stationId || '',
          role: data.role,
        };

        const companySnap = await getDoc(doc(db, 'rentalCompanies', data.companyId));
        if (companySnap.exists()) staffEntry.companyName = companySnap.data().name;

        if (data.stationId) {
          const stationSnap = await getDoc(doc(db, 'rentalStations', data.stationId));
          if (stationSnap.exists()) staffEntry.stationName = stationSnap.data().name;
        }

        results.push(staffEntry);
      }

      setStaffRoles(results);
      setLoading(false);
    };

    fetchStaffRoles();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center py-10"><Loader className="animate-spin w-6 h-6 text-gray-500" /></div>;

  if (!staffRoles.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-gray-500 text-lg">No staff roles found.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6 space-y-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800">👷 Staff Dashboard</h1>
        {/* Staff Role Actions */}
        <section className="space-y-6">
          {staffRoles.map((staff) => (
            <div key={staff.id} className="bg-white rounded-xl border shadow p-6 space-y-4">
              <div className="space-y-1">
                <p><strong>🏢 Company:</strong> {staff.companyName || 'N/A'}</p>
                <p><strong>📍 Station:</strong> {staff.stationName || 'No Station'}</p>
                <p><strong>🧰 Role:</strong> <span className="capitalize">{staff.role}</span></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(staff.role === 'support' || staff.role === 'station_manager') && (
                  <>
                    <QuickAction label="🚲 Rent a Ride" href={`/rent?companyId=${staff.companyId}&stationId=${staff.stationId}`} />
                    <QuickAction label="🔄 Return Vehicle" href={`/return?companyId=${staff.companyId}&stationId=${staff.stationId}`} />
                    <QuickAction label="🚨 Report Vehicle Issue" href={`/vehicle-issues/report?companyId=${staff.companyId}&stationId=${staff.stationId}`} />
                    {staff.role === 'station_manager' && (
                      <QuickAction label="📊 View Station Stats" href={`/stats?companyId=${staff.companyId}&stationId=${staff.stationId}`} />
                    )}
                  </>
                )}

                {staff.role === 'technician' && (
                  <QuickAction label="🛠 Maintenance" href="/maintain" />
                )}

                {staff.role === 'company_admin' && (
                  <>
                    <QuickAction label="👥 Manage Staff" href="/manage-staff" />
                    <QuickAction label="🚲 Manage Vehicles" href="/vehicles" />
                    <QuickAction label="📦 Manage Orders" href="/rental-orders" />
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DashboardCard({ icon, title, value }: { icon: JSX.Element; title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border border-gray-200 flex items-center gap-4">
      <div className="text-[#00d289] bg-[#e6fff5] rounded-full p-2">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-lg font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-4 py-3 rounded-xl transition">
      {label}
    </Link>
  );
}
