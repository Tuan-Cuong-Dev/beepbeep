'use client';

import React from 'react';
// Giả sử bạn đặt TabType vào file này
export type TabType = 'profile' | 'vehicles' | 'insurance' | 'issues';

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'profile', label: 'My Profile' },
  { key: 'vehicles', label: 'My Vehicles' },
  { key: 'insurance', label: 'My Insurance Packages' },
  { key: 'issues', label: 'My Reported Issues' },
];

export default function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
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
