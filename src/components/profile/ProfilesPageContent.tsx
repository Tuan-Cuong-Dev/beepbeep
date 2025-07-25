'use client';

import { useEffect, useState } from 'react';
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
import MyBusinessSection from '@/src/components/profile/MyBusinessSection'; // ✅ NEW

// ✅ Include 'business' in the valid tabs
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

  // Load initial tab from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      router.push(`?tab=${tab}`);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserData(snap.data());
      }
    };
    fetchUserData();
  }, [currentUser]);

  if (!currentUser || !userData) return null;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header + Avatar */}
      <div className="bg-white shadow-sm">
        <ProfileOverview />
      </div>

      {/* Tabs */}
      <div className="bg-white border-t border-b sticky top-0 z-10">
        <ProfileTabs activeTab={activeTab} setActiveTab={handleTabChange} userId={currentUser.uid} />
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar */}
        <aside className="w-full md:flex-[1_1_33.333%] md:max-w-[33.333%]">
          <ProfileSidebar
            location={userData.address || t('profiles_page_content.no_address')}
            joinedDate={userData.joinedDate || '2025-01'}
            helpfulVotes={userData.helpfulVotes || 0}
          />
        </aside>

        {/* Main tab content */}
        <section className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {activeTab === 'activityFeed' && (
            <ProfileMainContent activeTab="activityFeed" />
          )}
          {activeTab === 'vehicles' && <MyVehiclesSection />}
          {activeTab === 'insurance' && <MyInsuranceSection />}
          {activeTab === 'issues' && <MyIssuesSection issues={[]} />}
          {activeTab === 'contributions' && <MyContributionsSection />}
          {activeTab === 'business' && <MyBusinessSection />} {/* ✅ NEW */}
        </section>
      </div>
    </div>
  );
}
