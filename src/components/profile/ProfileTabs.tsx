'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export type TabType =
  | 'activityFeed'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions';

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
  const { t } = useTranslation('common');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'activityFeed', label: t('profile_tabs.activity_feed') },
    { key: 'vehicles', label: t('profile_tabs.vehicles') },
    { key: 'insurance', label: t('profile_tabs.insurance') },
    { key: 'issues', label: t('profile_tabs.issues') },
    { key: 'contributions', label: t('profile_tabs.contributions') },
  ];

  return (
    <div className="w-full bg-white border-t border-gray-300 md:px-20">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-6 py-3 text-sm px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
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
