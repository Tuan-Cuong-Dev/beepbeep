'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Tab type definition
export type TabType =
  | 'activityFeed'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions'; // ✅ Thêm contributions

interface ProfileTabsProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export default function ProfileTabs({
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
}: ProfileTabsProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const urlTab = searchParams.get('tab') as TabType | null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'activityFeed', label: t('profile_tabs.activity_feed') },
    { key: 'vehicles', label: t('profile_tabs.vehicles') },
    { key: 'insurance', label: t('profile_tabs.insurance') },
    { key: 'issues', label: t('profile_tabs.issues') },
    { key: 'contributions', label: t('profile_tabs.contributions') }, // ✅ Thêm tab đóng góp
  ];

  const isValidTab = (tab: string | null): tab is TabType => {
    return tabs.some((t) => t.key === tab);
  };

  const [internalTab, setInternalTab] = useState<TabType>('activityFeed');

  useEffect(() => {
    if (isValidTab(urlTab)) {
      setInternalTab(urlTab);
    }
  }, [urlTab]);

  const handleTabClick = (tab: TabType) => {
    if (externalSetActiveTab) {
      externalSetActiveTab(tab);
    } else {
      setInternalTab(tab);
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
