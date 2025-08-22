'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';

import RentalCompanyDashboard from '@/src/components/dashboards/RentalCompanyDashboard';
import PrivateProviderDashboard from '@/src/components/dashboards/PrivateProviderDashboard';
import AgentDashboard from '@/src/components/dashboards/AgentDashboard';
import AdminDashboard from '@/src/components/dashboards/AdminDashboard';
import StaffDashboard from '@/src/components/dashboards/StaffDashboard';
import TechnicianDashboard from '@/src/components/dashboards/TechnicianDashboard';
import CompanyAdminDashboard from '@/src/components/dashboards/CompanyAdminDashboard';
import StationManagerDashboard from '@/src/components/dashboards/StationManagerDashboard';
import TechnicianAssistantDashboard from '@/src/components/dashboards/TechnicianAssistantDashboard'; // ✅ Mới thêm
import TechnicianPartnerDashboard from '@/src/components/dashboards/TechnicianPartnerDashboard';

interface StaffEntry {
  id: string;
  role: string;
  [key: string]: any;
}

export default function MyBusinessPage() {
  const { user, role, loading } = useUser();
  const router = useRouter();

  const [businessType, setBusinessType] = useState<
    'admin'|'technician_assistant'|'technician_partner'|
    'rental_company_owner'|'private_provider'|'agent'|
    'company_admin'|'station_manager'|'staff'|'technician'|null
  >(null);

  const [staffRoles, setStaffRoles] = useState<StaffEntry[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    const r = role?.toLowerCase();

    // ✅ Ưu tiên vai trò toàn cục
    if (r === 'technician_assistant') return setBusinessType('technician_assistant');
    if (r === 'technician_partner')  return setBusinessType('technician_partner');
    if (r === 'admin')               return setBusinessType('admin');
    if (r === 'private_provider')    return setBusinessType('private_provider'); // ✅ thêm

    const fetchData = async () => {
      // Owner của rental company
      const rentalOwnerQ = query(
        collection(db, 'rentalCompanies'),
        where('ownerId', '==', user.uid)
      );
      // Owner của private provider
      const providerOwnerQ = query(
        collection(db, 'privateProviders'),
        where('ownerId', '==', user.uid)
      );
      // Owner của agent
      const agentQ = query(collection(db, 'agents'), where('ownerId', '==', user.uid));
      
      console.log('provider owner?', !(await getDocs(query(collection(db,'privateProviders'),where('ownerId','==',user.uid)))).empty);

      const [rentalSnap, providerSnap, agentSnap] = await Promise.all([
        getDocs(rentalOwnerQ),
        getDocs(providerOwnerQ),
        getDocs(agentQ),
      ]);

      if (!rentalSnap.empty)  return setBusinessType('rental_company_owner');
      if (!providerSnap.empty) return setBusinessType('private_provider');   // ✅ đúng collection
      if (!agentSnap.empty)    return setBusinessType('agent');

      // Fallback staff
      const staffQ = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const staffSnap = await getDocs(staffQ);

      if (!staffSnap.empty) {
        const staffData: StaffEntry[] = staffSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setStaffRoles(staffData);

        switch ((staffData[0]?.role ?? '').toLowerCase()) {
          case 'technician':      return setBusinessType('technician');
          case 'station_manager': return setBusinessType('station_manager');
          case 'company_admin':   return setBusinessType('company_admin');
          default:                return setBusinessType('staff');
        }
      }

      router.replace('/my-business/create');
    };

    fetchData();
  }, [user, role, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen space-y-6 bg-gray-50">
      {businessType === 'admin' && <AdminDashboard />}
      {businessType === 'technician_assistant' && <TechnicianAssistantDashboard />} 
      {businessType === 'technician_partner' && <TechnicianPartnerDashboard />}
      {businessType === 'rental_company_owner' && <RentalCompanyDashboard />}
      {businessType === 'private_provider' && <PrivateProviderDashboard />}  {/* ✅ */}
      {businessType === 'agent' && <AgentDashboard />}
      {businessType === 'company_admin' && <CompanyAdminDashboard />}
      {businessType === 'station_manager' && <StationManagerDashboard />}
      {businessType === 'staff' && <StaffDashboard />}
      {businessType === 'technician' && <TechnicianDashboard />}
      {!businessType && <div className="text-center text-gray-500">No business found.</div>}
    </main>
  );
}
