'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { TabSettingsModal } from './TabSettingsModal';
import { VisibleTab } from './types';

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
  userId?: string;
}

const defaultTabs: VisibleTab[] = [
  { key: 'activityFeed', label: 'Activity Feed', visible: true },
  { key: 'vehicles', label: 'My Vehicles', visible: true },
  { key: 'insurance', label: 'Insurance', visible: true },
  { key: 'issues', label: 'Issues', visible: true },
  { key: 'contributions', label: 'Contributions', visible: true },
  { key: 'business', label: 'Business', visible: true },
];

export default function ProfileTabs({ activeTab, setActiveTab, userId }: ProfileTabsProps) {
  const { t } = useTranslation('common');
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<VisibleTab[]>(defaultTabs);

  const storageKey = `profileTabsConfig_${userId || 'guest'}`;

  // Load config từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setVisibleTabs(parsed);
          return;
        }
      } catch (err) {
        console.warn('Tab config parse failed:', err);
      }
    }
    setVisibleTabs(defaultTabs);
  }, [storageKey]);

  const translatedTabs = visibleTabs.map((tab) => ({
    ...tab,
    label: t(`profile_tabs.${tab.key}`, tab.label),
  }));

  const visibleTabList = translatedTabs.filter((tab) => tab.visible);

  return (
    <div className="w-full bg-white border-t border-gray-300 md:px-20">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-6 text-sm overflow-x-auto">
            {visibleTabList.length === 0 ? (
              <span className="text-gray-500 italic">No tabs selected</span>
            ) : (
              visibleTabList.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={clsx(
                    'whitespace-nowrap',
                    activeTab === tab.key
                      ? 'text-[#00d289] underline underline-offset-4 font-medium'
                      : 'text-gray-700 hover:underline hover:decoration-[#00d289] hover:decoration-2 hover:underline-offset-4'
                  )}
                >
                  {tab.label}
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => setShowTabSettings(true)}
            className="ml-4 text-gray-500 hover:text-[#00d289]"
            title="Manage visible tabs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {showTabSettings && (
        <TabSettingsModal
          visibleTabs={visibleTabs}
          setVisibleTabs={setVisibleTabs}
          storageKey={storageKey}
          onClose={() => setShowTabSettings(false)}
        />
      )}
    </div>
  );
}
