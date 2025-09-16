'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import SettingsDropdown from './SettingsDropdown';
import { useTranslation } from 'react-i18next';

type UserLite = {
  uid: string;
  name?: string;
  username?: string;
  photoURL?: string;
  coverURL?: string;
  role?: string;
  address?: string;
  helpfulVotes?: number;
  totalContributions?: number;
};

interface DesktopProfileOverviewProps {
  /** uid của profile cần hiển thị (agent hoặc user bất kỳ) */
  userId: string;
  /** dữ liệu đã load sẵn (nếu truyền sẽ không fetch lại) */
  userPrefetched?: Partial<UserLite> | null;
  /** chỉ hiển thị nút Edit/Settings khi là chủ profile */
  isOwner?: boolean;
  /** callback khi bấm Edit */
  onEditProfile?: () => void;
}

export default function DesktopProfileOverview({
  userId,
  userPrefetched,
  isOwner = false,
  onEditProfile,
}: DesktopProfileOverviewProps) {
  const { t } = useTranslation('common');

  const [user, setUser] = useState<UserLite | null>(
    userPrefetched ? ({ uid: userId, ...userPrefetched } as UserLite) : null
  );
  const [loading, setLoading] = useState(!userPrefetched);
  const [error, setError] = useState<string | null>(null);

  // Fetch user theo userId nếu chưa có dữ liệu từ parent
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (userPrefetched) {
        setUser({ uid: userId, ...userPrefetched } as UserLite);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (cancelled) return;
        setUser(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserLite) : null);
      } catch (e) {
        if (!cancelled) setError('load_failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, userPrefetched]);

  const addressText = useMemo(
    () => user?.address || t('desktop_profile_overview.default_address'),
    [user?.address, t]
  );

  // Skeleton state
  if (loading) {
    return (
      <div className="relative bg-white shadow-sm">
        <div className="relative w-full h-52 sm:h-64 md:h-72 lg:h-80 bg-gray-100 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between bg-white rounded-lg p-4 shadow-md gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-28 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !user) {
    return (
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <p className="text-sm text-gray-600">
            {t('desktop_profile_overview.loading_error', 'Không tải được thông tin hồ sơ.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white shadow-sm">
      {/* Cover */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 lg:h-80">
        <Image
          src={user.coverURL || '/assets/images/Cover_desktop.jpg'}
          alt="Cover"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between bg-white rounded-lg p-4 shadow-md gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative shrink-0">
              {user.photoURL ? (
                <Image src={user.photoURL} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-2xl">?</div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {user.name || t('desktop_profile_overview.unknown_name')}
              </h1>
              {user.username && (
                <p className="text-gray-500 text-sm truncate">@{user.username}</p>
              )}

              <div className="text-sm text-gray-600">
                <p>
                  {t('desktop_profile_overview.role')} {user.role || 'Customer'}
                </p>
                <p className="truncate">{addressText}</p>
                <p>
                  {user.helpfulVotes ?? 0} {t('desktop_profile_overview.helpful_votes')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats + Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-between">
            <div className="flex gap-6 text-center text-sm sm:text-base">
              <div>
                <p className="font-semibold">{user.totalContributions ?? 0}</p>
                <p className="text-gray-600">
                  {t('desktop_profile_overview.stats.contributions')}
                </p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-600">
                  {t('desktop_profile_overview.stats.followers')}
                </p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-600">
                  {t('desktop_profile_overview.stats.following')}
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEditProfile}
                  className="border px-4 py-1.5 rounded text-sm font-medium shadow-sm whitespace-nowrap hover:bg-gray-50"
                >
                  {t('desktop_profile_overview.edit_profile')}
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Settings"
                >
                  <SettingsDropdown />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
