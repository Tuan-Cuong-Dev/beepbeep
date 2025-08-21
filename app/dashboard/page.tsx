'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';

// Live location helpers
import { useAutoUpdateLocation } from '@/src/hooks/useAutoUpdateLocation';
import {
  resolveBusinessContext,
  shouldTrackLiveLocation,
} from '@/src/lib/live-location/roleMapping';

import RentalCompanyDashboard from '@/src/components/dashboards/RentalCompanyDashboard';
import PrivateProviderDashboard from '@/src/components/dashboards/PrivateProviderDashboard';
import AgentDashboard from '@/src/components/dashboards/AgentDashboard';
import AdminDashboard from '@/src/components/dashboards/AdminDashboard';
import StaffDashboard from '@/src/components/dashboards/StaffDashboard';
import TechnicianDashboard from '@/src/components/dashboards/TechnicianDashboard';
import CompanyAdminDashboard from '@/src/components/dashboards/CompanyAdminDashboard';
import StationManagerDashboard from '@/src/components/dashboards/StationManagerDashboard';
import TechnicianAssistantDashboard from '@/src/components/dashboards/TechnicianAssistantDashboard';
import TechnicianPartnerDashboard from '@/src/components/dashboards/TechnicianPartnerDashboard';

type PageBusinessType =
  | 'admin' | 'technician_assistant' | 'technician_partner'
  | 'rental_company_owner' | 'private_provider' | 'agent'
  | 'company_admin' | 'station_manager' | 'staff' | 'technician' | null;

interface StaffEntry {
  id: string;
  role: string;
  companyId?: string | null;
  [key: string]: any;
}

export default function MyBusinessPage() {
  const router = useRouter();
  const { user, role, loading } = useUser();

  const [businessType, setBusinessType] = useState<PageBusinessType>(null);
  const [staffRoles, setStaffRoles] = useState<StaffEntry[]>([]);

  // Dành riêng cho technician_partner → xác định type 'mobile' | 'shop' + id
  const [technicianPartnerType, setTechnicianPartnerType] = useState<'mobile' | 'shop' | null>(null);
  const [technicianPartnerId, setTechnicianPartnerId] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // ===== 1) Xác định businessType theo vai trò người dùng =====
  useEffect(() => {
    if (loading || !user) return;

    const r = role?.toLowerCase();

    // Ưu tiên vai trò toàn cục
    if (r === 'technician_assistant') return setBusinessType('technician_assistant');
    if (r === 'technician_partner')  return setBusinessType('technician_partner');
    if (r === 'admin')               return setBusinessType('admin');
    if (r === 'private_provider')    return setBusinessType('private_provider');

    (async () => {
      // Chủ sở hữu
      const rentalOwnerQ   = query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid));
      const providerOwnerQ = query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid));
      const agentOwnerQ    = query(collection(db, 'agents'),          where('ownerId', '==', user.uid));

      const [rentalSnap, providerSnap, agentSnap] = await Promise.all([
        getDocs(rentalOwnerQ),
        getDocs(providerOwnerQ),
        getDocs(agentOwnerQ),
      ]);

      if (!mounted.current) return;

      if (!rentalSnap.empty)   return setBusinessType('rental_company_owner');
      if (!providerSnap.empty) return setBusinessType('private_provider');
      if (!agentSnap.empty)    return setBusinessType('agent');

      // Fallback: staff
      const staffQ = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const staffSnap = await getDocs(staffQ);

      if (!mounted.current) return;

      if (!staffSnap.empty) {
        const staffData: StaffEntry[] = staffSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setStaffRoles(staffData);

        const mainRole = (staffData[0]?.role ?? '').toLowerCase();
        if (mainRole === 'technician')      return setBusinessType('technician');
        if (mainRole === 'station_manager') return setBusinessType('station_manager');
        if (mainRole === 'company_admin')   return setBusinessType('company_admin');
        return setBusinessType('staff');
      }

      // Không phải owner, không có staff → đi flow tạo doanh nghiệp
      router.replace('/my-business/create');
    })();
  }, [loading, user, role, router]);

  // ===== 2) Nếu là technician_partner → lấy type & id cho quyết định tracking =====
  useEffect(() => {
    if (businessType !== 'technician_partner' || !user?.uid) return;

    (async () => {
      const snap = await getDocs(
        query(collection(db, 'technicianPartners'), where('userId', '==', user.uid))
      );
      if (!mounted.current) return;
      if (!snap.empty) {
        const d0 = snap.docs[0];
        const data = d0.data() as any;
        setTechnicianPartnerId(d0.id);
        setTechnicianPartnerType(data?.type ?? null); // 'mobile' | 'shop'
      } else {
        setTechnicianPartnerId(null);
        setTechnicianPartnerType(null);
      }
    })();
  }, [businessType, user?.uid]);

  // ===== 3) Chuẩn bị ngữ cảnh live-location & kích hoạt cập nhật khi vào dashboard =====
  const { businessType: btForLive, companyId, entityId } = useMemo(
    () =>
      resolveBusinessContext({
        pageBusinessType: businessType,
        staffRoles,
        technicianPartnerId,
      }),
    [businessType, staffRoles, technicianPartnerId]
  );

  const enableLive = useMemo(
    () =>
      shouldTrackLiveLocation({
        businessType: btForLive,
        pageBusinessType: businessType,
        staffRoles,
        technicianPartnerType,     // chỉ 'mobile' mới true cho technician_partner
        privateProviderIsMobile: false,
      }),
    [btForLive, businessType, staffRoles, technicianPartnerType]
  );

  useAutoUpdateLocation({
    enabled: !!user?.uid && enableLive,
    uid: user?.uid ?? null,
    displayName: (user as any)?.name ?? user?.name ?? null,
    businessType: btForLive,
    companyId,
    entityId,
    ttlMinutes: 15,
    watch: false, // chỉ cập nhật 1 lần khi user vào dashboard
  });

  // ===== 4) UI =====
  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen space-y-6 bg-gray-50">
      {businessType === 'admin'                && <AdminDashboard />}
      {businessType === 'technician_assistant' && <TechnicianAssistantDashboard />}
      {businessType === 'technician_partner'   && <TechnicianPartnerDashboard />}
      {businessType === 'rental_company_owner' && <RentalCompanyDashboard />}
      {businessType === 'private_provider'     && <PrivateProviderDashboard />}
      {businessType === 'agent'                && <AgentDashboard />}
      {businessType === 'company_admin'        && <CompanyAdminDashboard />}
      {businessType === 'station_manager'      && <StationManagerDashboard />}
      {businessType === 'staff'                && <StaffDashboard />}
      {businessType === 'technician'           && <TechnicianDashboard />}
      {!businessType && (
        <div className="text-center text-gray-500">No business found.</div>
      )}
    </main>
  );
}
