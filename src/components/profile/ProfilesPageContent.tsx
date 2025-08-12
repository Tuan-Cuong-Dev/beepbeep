'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import ProfileOverview from '@/src/components/profile/ProfileOverview';
import ProfileTabs, { TabType } from '@/src/components/profile/ProfileTabs';
import ProfileSidebar from '@/src/components/profile/ProfileSidebar';
import ProfileMainContent from '@/src/components/profile/ProfileMainContent';
import MyVehiclesSection from '@/src/components/personalVehicles/MyVehiclesSection';
import MyInsuranceSection from '@/src/components/profile/MyInsuranceSection';
import MyIssuesSection from '@/src/components/profile/MyIssuesSection';
import MyContributionsSection from '@/src/components/profile/MyContributionsSection';
import MyBusinessSection from '@/src/components/profile/MyBusinessSection';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

const validTabs: TabType[] = [
  'activityFeed',
  'vehicles',
  'insurance',
  'issues',
  'contributions',
  'business',
];

export default function ProfilesPageContent() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('activityFeed');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType | null;
    if (tab && validTabs.includes(tab)) setActiveTab(tab);
  }, []);

  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      router.push(`?tab=${tab}`);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserData(snap.data());
    };
    fetchUserData();
  }, [currentUser]);

  // Map role -> BusinessType (đồng bộ CreateBusinessForm)
  const businessTypeFromRole = useMemo<BusinessType | undefined>(() => {
    const role = userData?.role as string | undefined;
    switch (role) {
      case 'company_owner':
        return 'rental_company';
      case 'private_owner':
        return 'private_provider';
      case 'agent':
        return 'agent';
      case 'technician_partner':
        return 'technician_partner';
      case 'intercity_bus':
        return 'intercity_bus';
      case 'vehicle_transport':
        return 'vehicle_transport';
      case 'tour_guide':
        return 'tour_guide';
      default:
        return undefined;
    }
  }, [userData?.role]);

  const businessId = userData?.companyId as string | undefined;

  if (!currentUser || !userData) return null;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header + Avatar */}
      <div className="bg-white shadow-sm">
        <ProfileOverview />
      </div>

      {/* Tabs */}
      <div className="bg-white border-t border-b sticky top-0 z-10">
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userId={currentUser.uid}
        />
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar */}
        <aside className="w-full md:flex-[1_1_33.333%] md:max-w-[33.333%]">
          <ProfileSidebar
            // ✅ truyền xuống để BusinessAboutSection hoạt động
            businessId={businessId}
            businessType={businessTypeFromRole}
            location={userData.address || t('profiles_page_content.no_address')}
            joinedDate={userData.joinedDate || '2025-01'}
            helpfulVotes={userData.helpfulVotes || 0}
          />
        </aside>

        {/* Main tab content */}
        <section className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {activeTab === 'activityFeed' && <ProfileMainContent activeTab="activityFeed" />}
          {activeTab === 'vehicles' && <MyVehiclesSection />}
          {activeTab === 'insurance' && <MyInsuranceSection />}
          {activeTab === 'issues' && <MyIssuesSection issues={[]} />}
          {activeTab === 'contributions' && <MyContributionsSection />}
          {activeTab === 'business' && <MyBusinessSection />}
        </section>
      </div>
    </div>
  );
}
