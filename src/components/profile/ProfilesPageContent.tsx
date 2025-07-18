'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

import ProfileOverview from '@/src/components/profile/ProfileOverview';
import ProfileTabs, { TabType } from '@/src/components/profile/ProfileTabs';
import ProfileSidebar from '@/src/components/profile/ProfileSidebar';
import ProfileMainContent from '@/src/components/profile/ProfileMainContent';
import MyVehiclesSection from '@/src/components/personalVehicles/MyVehiclesSection';
import MyInsuranceSection from '@/src/components/profile/MyInsuranceSection';
import MyIssuesSection from '@/src/components/profile/MyIssuesSection';
import MyContributionsSection from '@/src/components/profile/MyContributionsSection';
import { useTranslation } from 'react-i18next';

const mockIssues = [
  {
    title: 'Xe không khởi động',
    status: 'pending',
    location: 'Gần Lotte Mart',
    reportedAt: '2025-07-01',
  },
];

const validTabs: TabType[] = [
  'activityFeed',
  'vehicles',
  'insurance',
  'issues',
  'contributions', // ✅ NEW
];

export default function ProfilesPageContent() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTab = searchParams?.get('tab') as TabType | null;
  const isValidTab = (tab: string | null): tab is TabType => validTabs.includes(tab as TabType);
  const [activeTab, setActiveTab] = useState<TabType>('activityFeed');

  useEffect(() => {
    if (isValidTab(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserData(snap.data());
      }
    };
    fetchUser();
  }, [currentUser]);

  if (!userData) {
    return <div className="p-4">{t('profiles_page_content.loading')}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Tổng quan hồ sơ */}
      <div className="bg-white shadow-sm">
        <ProfileOverview />
      </div>

      {/* Tabs điều hướng */}
      <div className="bg-white border-t border-b sticky top-0 z-10">
        <ProfileTabs activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Nội dung chính */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar trái */}
        <div className="w-full md:flex-[1_1_33.333%] md:max-w-[33.333%]">
          <ProfileSidebar
            location={userData.address || t('profiles_page_content.no_address')}
            joinedDate={userData.joinedDate || '2025-01'}
            helpfulVotes={userData.helpfulVotes || 0}
          />
        </div>

        {/* Nội dung tab phải */}
        <div className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {activeTab === 'activityFeed' && <ProfileMainContent activeTab="profile" />}
          {activeTab === 'vehicles' && <MyVehiclesSection />}
          {activeTab === 'insurance' && <MyInsuranceSection />}
          {activeTab === 'issues' && <MyIssuesSection issues={mockIssues} />}
          {activeTab === 'contributions' && <MyContributionsSection />} {/* ✅ NEW */}
        </div>
      </div>
    </div>
  );
}
