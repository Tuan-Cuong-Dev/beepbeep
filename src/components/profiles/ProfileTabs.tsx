'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Tab type definition
export type TabType = 'activityFeed' | 'vehicles' | 'insurance' | 'issues';

interface ProfileTabsProps {
  activeTab?: TabType; // optional
  setActiveTab?: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'activityFeed', label: 'Activity feed' },
  { key: 'vehicles', label: 'My Vehicles' },
  { key: 'insurance', label: 'My Insurance Packages' },
  { key: 'issues', label: 'My Reported Issues' },
];

export default function ProfileTabs({ activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }: ProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const urlTab = searchParams.get('tab') as TabType | null;

  const isValidTab = (tab: string | null): tab is TabType => {
    return tabs.some((t) => t.key === tab);
  };

  const [internalTab, setInternalTab] = useState<TabType>('activityFeed');

  // Sync tab from URL
  useEffect(() => {
    if (isValidTab(urlTab)) {
      setInternalTab(urlTab);
    }
  }, [urlTab]);

  const handleTabClick = (tab: TabType) => {
    if (externalSetActiveTab) {
      externalSetActiveTab(tab); // allow parent to control
    } else {
      setInternalTab(tab); // internal control
    }
    router.push(`?tab=${tab}`);
  };

  const currentTab = externalActiveTab || internalTab;

  return (
    <div className="w-full bg-white border-t border-gray-300 md:px-20">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-6 py-3 text-sm px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={
                currentTab === tab.key
                  ? 'text-[#00d289] underline underline-offset-4 font-medium whitespace-nowrap'
                  : 'text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4 whitespace-nowrap'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
