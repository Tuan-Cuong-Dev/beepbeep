'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';

import RentalCompanyDashboard from '@/src/components/my-business/dashboards/RentalCompanyDashboard';
import PrivateProviderDashboard from '@/src/components/my-business/dashboards/PrivateProviderDashboard';
import AgentDashboard from '@/src/components/my-business/dashboards/AgentDashboard';
import AdminDashboard from '@/src/components/my-business/dashboards/AdminDashboard';
import StaffDashboard from '@/src/components/my-business/dashboards/StaffDashboard';
import TechnicianDashboard from '@/src/components/my-business/dashboards/TechnicianDashboard';
import CompanyAdminDashboard from '@/src/components/my-business/dashboards/CompanyAdminDashboard';
import StationManagerDashboard from '@/src/components/my-business/dashboards/StationManagerDashboard';
import TechnicianAssistantDashboard from '@/src/components/my-business/dashboards/TechnicianAssistantDashboard'; // ✅ Mới thêm

interface StaffEntry {
  id: string;
  role: string;
  [key: string]: any;
}

export default function MyBusinessPage() {
  const { user, role, companyId, loading } = useUser();
  const router = useRouter();

  const [businessType, setBusinessType] = useState<
    'admin' |
    'technician_assistant' |
    'rental_company_owner' |
    'private_provider' |
    'agent' |
    'company_admin' |
    'station_manager' |
    'staff' |
    'technician' |
    null
  >(null);

  const [staffRoles, setStaffRoles] = useState<StaffEntry[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    // Ưu tiên nếu là Technician Assistant
    if (role === 'technician_assistant') {
      setBusinessType('technician_assistant');
      return;
    }

    if (role === 'Admin') {
      setBusinessType('admin');
      return;
    }

    const fetchData = async () => {
      const rentalQuery = query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid));
      const agentQuery = query(collection(db, 'agents'), where('ownerId', '==', user.uid));
      const providerQuery = query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid));

      const [rentalSnap, agentSnap, providerSnap] = await Promise.all([
        getDocs(rentalQuery),
        getDocs(agentQuery),
        getDocs(providerQuery),
      ]);

      if (!rentalSnap.empty) {
        setBusinessType('rental_company_owner');
        return;
      }

      if (!agentSnap.empty) {
        setBusinessType('agent');
        return;
      }

      if (!providerSnap.empty) {
        setBusinessType('private_provider');
        return;
      }

      const staffQuery = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const staffSnap = await getDocs(staffQuery);

      if (!staffSnap.empty) {
        const staffData: StaffEntry[] = staffSnap.docs.map(doc => {
          const data = doc.data() as { role: string };
          return {
            id: doc.id,
            ...data,
          };
        });

        setStaffRoles(staffData);

        const staffRole = staffData[0]?.role?.toLowerCase() || '';
        switch (staffRole) {
          case 'technician':
            setBusinessType('technician');
            break;
          case 'station_manager':
            setBusinessType('station_manager');
            break;
          case 'company_admin':
            setBusinessType('company_admin');
            break;
          default:
            setBusinessType('staff');
        }

        return;
      }

      router.replace('/my-business/create');
    };

    fetchData();
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-gray-50">
      {businessType === 'admin' && <AdminDashboard />}
      {businessType === 'technician_assistant' && <TechnicianAssistantDashboard />} {/* ✅ Mới thêm */}
      {businessType === 'rental_company_owner' && <RentalCompanyDashboard />}
      {businessType === 'private_provider' && <PrivateProviderDashboard />}
      {businessType === 'agent' && <AgentDashboard />}
      {businessType === 'company_admin' && <CompanyAdminDashboard />}
      {businessType === 'station_manager' && <StationManagerDashboard />}
      {businessType === 'staff' && <StaffDashboard />}
      {businessType === 'technician' && <TechnicianDashboard />}
      {!businessType && (
        <div className="text-center text-gray-500">No business found.</div>
      )}
    </main>
  );
}
