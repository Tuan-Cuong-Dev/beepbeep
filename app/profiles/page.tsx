'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import ProfileOverview from '@/src/components/profiles/ProfileOverview';
import ProfileTabs from '@/src/components/profiles/ProfileTabs';
import ProfileSidebar from '@/src/components/profiles/ProfileSidebar';
import ProfileMainContent from '@/src/components/profiles/ProfileMainContent';
import MyVehiclesSection from '@/src/components/personalVehicles/MyVehiclesSection';
import MyInsuranceSection from '@/src/components/profiles/MyInsuranceSection';
import MyIssuesSection from '@/src/components/profiles/MyIssuesSection';

const mockVehicles = [
  { model: 'Mocha S', plateNumber: '43C1-123.45', frameNumber: 'RL9Y9ENUMRBDE0182' },
];

const mockInsurances = [
  { name: 'Bíp Bíp 365', validUntil: '2026-01-01' },
];

const mockIssues = [
  { title: 'Xe không khởi động', status: 'pending', location: 'Gần Lotte Mart', reportedAt: '2025-07-01' },
];

type TabType = 'profile' | 'vehicles' | 'insurance' | 'issues';

export default function ProfilesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);

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
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Overview Section */}
      <div className="bg-white shadow-sm">
        <ProfileOverview />
      </div>

      {/* Tabs Section */}
      <div className="bg-white border-t border-b sticky top-0 z-10">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar luôn chiếm 1/3 */}
        <div className="w-full md:flex-[1_1_33.333%] md:max-w-[33.333%]">
          <ProfileSidebar
            location={userData.address || 'Chưa cập nhật'}
            joinedDate={userData.joinedDate || '2025-01'}
            helpfulVotes={userData.helpfulVotes || 0}
          />
        </div>

        {/* Content chiếm 2/3 */}
        <div className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {activeTab === 'profile' && <ProfileMainContent activeTab="profile" />}
          {activeTab === 'vehicles' && <MyVehiclesSection vehicles={mockVehicles} />}
          {activeTab === 'insurance' && <MyInsuranceSection insurances={mockInsurances} />}
          {activeTab === 'issues' && <MyIssuesSection issues={mockIssues} />}
        </div>
      </div>

    </div>
  );
}
