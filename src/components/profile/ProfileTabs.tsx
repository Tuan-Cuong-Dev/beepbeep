'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx'; // optional: nếu bạn dùng clsx hoặc tailwind-merge

export type TabType =
  | 'activityFeed'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions'
  | 'business';

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

// Define tab config outside component
const tabConfig: { key: TabType; i18nKey: string }[] = [
  { key: 'activityFeed', i18nKey: 'profile_tabs.activity_feed' },
  { key: 'vehicles', i18nKey: 'profile_tabs.vehicles' },
  { key: 'insurance', i18nKey: 'profile_tabs.insurance' },
  { key: 'issues', i18nKey: 'profile_tabs.issues' },
  { key: 'contributions', i18nKey: 'profile_tabs.contributions' },
  { key: 'business', i18nKey: 'profile_tabs.business' }, // ✅ Added
];

export default function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
  const { t } = useTranslation('common');

  return (
    <div className="w-full bg-white border-t border-gray-300 md:px-20">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-6 py-3 text-sm px-4">
          {tabConfig.map(({ key, i18nKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                'whitespace-nowrap',
                activeTab === key
                  ? 'text-[#00d289] underline underline-offset-4 font-medium'
                  : 'text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4'
              )}
            >
              {t(i18nKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
