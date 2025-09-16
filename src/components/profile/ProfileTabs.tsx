'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { TabSettingsModal } from './TabSettingsModal';
import type { TabType, VisibleTab } from './types';

// 🔁 Re-export types để các import cũ như
// `import { TabType } from '@/src/components/profile/ProfileTabs'` vẫn chạy
export type { TabType, VisibleTab } from './types';

// Firestore
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userId?: string;          // ID của profile đang xem
  allowedTabs?: TabType[];  // Tab công khai cho viewer (ví dụ chỉ activityFeed + showcase)
  canConfigure?: boolean;   // true nếu người đang xem là chủ profile
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
/** Merge nhưng GIỮ thứ tự đã lưu:
 * - Ưu tiên order từ stored (Firestore/local)
 * - Bổ sung các tab mới (có trong default nhưng chưa có trong stored) ở cuối, theo thứ tự default
 * - Chuẩn hoá label/visible theo default + stored
 * - Đảm bảo còn ít nhất 1 tab visible
 */
  function mergeTabsConfig(stored: VisibleTab[] | null): VisibleTab[] {
    const defs = [...defaultTabs];
    const defByKey = new Map(defs.map(d => [d.key, d]));

    if (!stored || !Array.isArray(stored)) {
      // không có cấu hình cũ → trả về default
      return [...defs];
    }

    // 1) Lấy theo thứ tự đã lưu, chỉ nhận key hợp lệ, và "nạp" default để đủ shape
    const knownStored = stored.filter(s => defByKey.has(s.key));
    const normalizedStored = knownStored.map(s => {
      const def = defByKey.get(s.key)!;
      // default cung cấp label mặc định, stored ghi đè visible/label nếu có
      return { ...def, ...s };
    });

    // 2) Giữ cả các key lạ (nếu có) ở cuối (backward-compat)
    const unknownStored = stored.filter(s => !defByKey.has(s.key));

    // 3) Thêm các tab mới (có trong default nhưng chưa có trong stored) vào cuối theo thứ tự default
    const missingFromDefault = defs.filter(d => !normalizedStored.some(s => s.key === d.key));

    const merged = [...normalizedStored, ...missingFromDefault, ...unknownStored];

    // 4) Đảm bảo tối thiểu 1 tab visible
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
  const [loading, setLoading] = useState(true);

  // cache local: guest trước login, user sau login
  const storageKey = `profileTabsConfig_${userId ?? 'guest'}`;

  // tránh vòng lặp khi vừa setDoc xong mà onSnapshot bắn về
  const isSavingRef = useRef(false);

  // ⚠️ Chỉ migrate guest -> user khi là CHỦ profile
  useEffect(() => {
    if (!userId || !canConfigure) return;
    const guestKey = 'profileTabsConfig_guest';
    const guestRaw = localStorage.getItem(guestKey);
    const userKey  = `profileTabsConfig_${userId}`;
    if (guestRaw && !localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, guestRaw);
      localStorage.removeItem(guestKey);
    }
  }, [userId, canConfigure]);

  /**
   * Nguồn dữ liệu:
   * - Nếu có userId:
   *    • CHỦ profile (canConfigure=true): nghe realtime từ Firestore; nếu chưa có cloud config thì seed từ local.
   *    • VIEWER (canConfigure=false): chỉ đọc Firestore; KHÔNG seed/ghi/migrate.
   * - Nếu chưa có userId: dùng localStorage guest.
   */
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const loadGuest = () => {
      const localRaw = localStorage.getItem(storageKey);
      const fromLocal = localRaw ? (JSON.parse(localRaw) as VisibleTab[]) : null;
      const merged = mergeTabsConfig(fromLocal);
      if (!cancelled) {
        setVisibleTabs(merged);
        setLoading(false);
      }
      if (JSON.stringify(fromLocal) !== JSON.stringify(merged)) {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }
    };

    const loadWithFirestore = async () => {
      try {
        const ref = doc(db, 'users', userId!, 'settings', 'profileTabs');

        const snap = await getDoc(ref);
        const remote = snap.exists() ? ((snap.data().tabs || null) as VisibleTab[] | null) : null;

        if (!remote && canConfigure) {
          // CHỦ profile: seed lần đầu từ local (nếu có), ngược lại dùng default
          const localRaw = localStorage.getItem(storageKey);
          const fromLocal = localRaw ? (JSON.parse(localRaw) as VisibleTab[]) : null;
          const initial = mergeTabsConfig(fromLocal);
          isSavingRef.current = true;
          await setDoc(ref, { tabs: initial }, { merge: true });
          isSavingRef.current = false;

          if (!cancelled) {
            setVisibleTabs(initial);
            setLoading(false);
          }
          localStorage.setItem(storageKey, JSON.stringify(initial));
        } else {
          // VIEWER hoặc đã có remote sẵn: dùng remote (hoặc default nếu remote null)
          const initial = mergeTabsConfig(remote);
          if (!cancelled) {
            setVisibleTabs(initial);
            setLoading(false);
          }
          localStorage.setItem(storageKey, JSON.stringify(initial));
        }

        // Lắng nghe realtime
        unsubscribe = onSnapshot(ref, (docSnap) => {
          if (!docSnap.exists()) return;
          if (isSavingRef.current) return; // bỏ qua callback ngay sau khi mình set
          const cloudTabs = (docSnap.data().tabs || []) as VisibleTab[];
          const merged = mergeTabsConfig(cloudTabs);
          setVisibleTabs(prev => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
          localStorage.setItem(storageKey, JSON.stringify(merged));
        });
      } catch (e) {
        // Có thể do không có quyền đọc với viewer → dùng default (tránh “rây” guest sai người)
        const merged = mergeTabsConfig(null);
        if (!cancelled) {
          setVisibleTabs(merged);
          setLoading(false);
        }
      }
    };

    if (!userId) {
      loadGuest();
      return () => { cancelled = true; };
    } else {
      loadWithFirestore();
      return () => {
        cancelled = true;
        if (unsubscribe) unsubscribe();
      };
    }
  }, [userId, storageKey, canConfigure]);

  // dịch nhãn với defaultValue
  const translatedTabs = useMemo(
    () => visibleTabs.map(tab => ({
      ...tab,
      label: t(`profile_tabs.${tab.key}`, { defaultValue: tab.label }),
    })),
    [visibleTabs, t]
  );

  // lọc theo allowedTabs (viewer chỉ thấy tab public)
  const visibleTabList = useMemo(
    () =>
      translatedTabs.filter(tab =>
        tab.visible && (!allowedTabs || allowedTabs.includes(tab.key as TabType))
      ),
    [translatedTabs, allowedTabs]
  );

  // nếu activeTab không còn hiển thị → nhảy sang tab visible đầu tiên
  const visibleKeysString = useMemo(() => visibleTabList.map(t => t.key).join('|'), [visibleTabList]);
  useEffect(() => {
    const keys = visibleTabList.map(t => t.key as TabType);
    if (keys.length > 0 && !keys.includes(activeTab)) {
      setActiveTab(keys[0]);
    }
  }, [visibleKeysString, activeTab, setActiveTab]);

  // Lưu: state + cache local + (Cloud nếu CHỦ profile)
    const persistTabs = async (tabs: VisibleTab[]) => {

    setVisibleTabs(tabs);
    localStorage.setItem(storageKey, JSON.stringify(tabs));

    if (userId && canConfigure) {
      try {
        isSavingRef.current = true;
        const ref = doc(db, 'users', userId, 'settings', 'profileTabs');
        await setDoc(ref, { tabs }, { merge: true });
      } catch (e) {
      } finally {
        isSavingRef.current = false;
      }
    }
  };


  return (
    <div className="w-full bg-white border-t border-gray-300 md:px-20">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-6 text-sm overflow-x-auto">
            {loading ? (
              <span className="text-gray-400 italic">Loading tabs…</span>
            ) : visibleTabList.length === 0 ? (
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
          visibleTabs={visibleTabs}          // truyền full list, không áp allowedTabs trong modal
          setVisibleTabs={persistTabs}
          storageKey={storageKey}            // '..._guest' hoặc '..._<userId>'
          onClose={() => setShowTabSettings(false)}
        />
      )}
    </div>
  );
}
