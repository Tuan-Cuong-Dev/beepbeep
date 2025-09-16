// Date : 16/09/2025
// Đã logic để hiện thị tab nào public và private + giữ cấu hình sau refresh

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { TabSettingsModal } from './TabSettingsModal';
import { VisibleTab } from './types';

export type TabType =
  | 'activityFeed'
  | 'showcase'
  | 'vehicles'
  | 'insurance'
  | 'issues'
  | 'contributions'
  | 'business';

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userId?: string;

  /** Danh sách tab công khai cho người xem (ví dụ: khách chỉ xem activityFeed + showcase) */
  allowedTabs?: TabType[];

  /** Chỉ chủ tài khoản mới được cấu hình tab */
  canConfigure?: boolean;
}

const defaultTabs: VisibleTab[] = [
  { key: 'activityFeed',   label: 'Activity Feed', visible: true },
  { key: 'business',       label: 'Business',      visible: true },
  { key: 'vehicles',       label: 'My Vehicles',   visible: true },
  { key: 'insurance',      label: 'Insurance',     visible: true },
  { key: 'issues',         label: 'Issues',        visible: true },
  { key: 'contributions',  label: 'Contributions', visible: true },
  { key: 'showcase',       label: 'Showcase',      visible: true },
];

/** Merge cấu hình cũ với danh sách tab chuẩn (bảo toàn thứ tự + thêm tab mới nếu thiếu) */
function mergeTabsConfig(stored: VisibleTab[] | null): VisibleTab[] {
  if (!stored || !Array.isArray(stored)) return defaultTabs;

  const byKey = new Map(stored.map(t => [t.key, t]));
  const merged: VisibleTab[] = defaultTabs.map(def => {
    const found = byKey.get(def.key);
    return found ? { ...def, ...found } : def;
  });

  // giữ các key lạ (nếu có) để backward-compat
  stored.forEach(old => {
    if (!merged.find(t => t.key === old.key)) merged.push(old);
  });

  // luôn đảm bảo tối thiểu 1 tab visible
  if (!merged.some(t => t.visible)) merged[0].visible = true;

  return merged;
}

export default function ProfileTabs({
  activeTab,
  setActiveTab,
  userId,
  allowedTabs,
  canConfigure = true,
}: ProfileTabsProps) {
  const { t } = useTranslation('common');
  const [showTabSettings, setShowTabSettings] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<VisibleTab[]>(defaultTabs);

  // ❗ Không dùng 'guest' nữa để tránh ghi nhầm trước khi có userId
  const storageKey = userId ? `profileTabsConfig_${userId}` : null;

  // 1) Migrate config từ guest -> user khi lần đầu có userId
  useEffect(() => {
    if (!userId) return;
    const guestKey = 'profileTabsConfig_guest';
    const guestRaw = localStorage.getItem(guestKey);
    const userKey = `profileTabsConfig_${userId}`;
    const userRaw = localStorage.getItem(userKey);
    if (guestRaw && !userRaw) {
      localStorage.setItem(userKey, guestRaw);
      localStorage.removeItem(guestKey);
    }
  }, [userId]);

  // 2) Chỉ load/persist khi có storageKey hợp lệ
  useEffect(() => {
    if (!storageKey) {
      setVisibleTabs(defaultTabs); // hiển thị tạm default, không persist
      return;
    }
    const raw = localStorage.getItem(storageKey);
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      const merged = mergeTabsConfig(parsed);
      setVisibleTabs(merged);
      if (JSON.stringify(parsed) !== JSON.stringify(merged)) {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (e) {
      console.warn('Tab config parse failed:', e);
      setVisibleTabs(defaultTabs);
      localStorage.setItem(storageKey, JSON.stringify(defaultTabs));
    }
  }, [storageKey]);

  // 3) Dịch nhãn
  const translatedTabs = useMemo(
    () =>
      visibleTabs.map((tab) => ({
        ...tab,
        label: t(`profile_tabs.${tab.key}`, tab.label),
      })),
    [visibleTabs, t]
  );

  // 4) Lọc theo allowedTabs (public/private)
  const visibleTabList = translatedTabs.filter(
    (tab) => tab.visible && (!allowedTabs || allowedTabs.includes(tab.key as TabType))
  );

  // 5) Hàm persist an toàn: chỉ ghi khi có storageKey
  const persistTabs = (tabs: VisibleTab[]) => {
    setVisibleTabs(tabs);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(tabs));
    }
  };

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

          {canConfigure && (
            <button
              onClick={() => setShowTabSettings(true)}
              className="ml-4 text-gray-500 hover:text-[#00d289]"
              title="Manage visible tabs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {canConfigure && showTabSettings && (
        <TabSettingsModal
          visibleTabs={visibleTabs}
          setVisibleTabs={persistTabs}
          storageKey={storageKey ?? ''}  // '' khi chưa có userId → modal sẽ không ghi localStorage
          onClose={() => setShowTabSettings(false)}
        />
      )}
    </div>
  );
}
