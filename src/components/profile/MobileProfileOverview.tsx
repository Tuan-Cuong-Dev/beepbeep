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
  photoURL?: string;
  coverURL?: string;
  role?: string;
  address?: string;
  totalContributions?: number;
};

interface MobileProfileOverviewProps {
  /** uid của profile cần hiển thị (agent hoặc user bất kỳ) */
  userId: string;
  /** dữ liệu đã load sẵn (nếu truyền sẽ không fetch lại) */
  userPrefetched?: Partial<UserLite> | null;
  /** có phải chủ tài khoản đang xem chính mình không */
  isOwner?: boolean;
  /** callback khi bấm Edit */
  onEditProfile?: () => void;
}

export default function MobileProfileOverview({
  userId,
  userPrefetched,
  isOwner = false,
  onEditProfile,
}: MobileProfileOverviewProps) {
  const { t } = useTranslation('common');

  const [user, setUser] = useState<UserLite | null>(
    userPrefetched ? ({ uid: userId, ...userPrefetched } as UserLite) : null
  );
  const [loading, setLoading] = useState(!userPrefetched);
  const [error, setError] = useState<string | null>(null);

  // Fetch user theo userId nếu chưa có dữ liệu
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
      } catch (e: any) {
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
    () => user?.address || t('mobile_profile_overview.default_address'),
    [user?.address, t]
  );

  if (loading) {
    return (
      <div className="bg-white">
        <div className="relative w-full h-24 bg-gray-100 animate-pulse" />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-28 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-white p-4">
        <p className="text-sm text-gray-600">
          {t('mobile_profile_overview.loading_error', 'Không tải được thông tin hồ sơ.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Cover Image */}
      <div className="relative w-full h-24">
        <Image
          src={user.coverURL || '/assets/images/Cover_desktop.jpg'}
          alt="Cover"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Profile Row */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md relative shrink-0">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-lg">
                ?
              </div>
            )}
          </div>

          <div className="text-sm min-w-0">
            <p className="font-semibold truncate max-w-[72vw]">
              {user.name || t('mobile_profile_overview.unknown_name')}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {t('mobile_profile_overview.role')} {user.role || 'Customer'}
            </p>
            <p className="text-gray-500 truncate">{addressText}</p>
          </div>
        </div>

        {/* Actions (chỉ chủ tài khoản mới thấy) */}
        {isOwner && (
          <div className="flex items-center ml-3 shrink-0">
            <button
              onClick={onEditProfile}
              className="h-8 px-3 text-sm border border-gray-300 rounded-l-md shadow-sm bg-white hover:bg-gray-50 max-w-[110px] truncate"
            >
              {t('mobile_profile_overview.edit_profile')}
            </button>
            <div className="h-8 w-9 border border-l-0 border-gray-300 rounded-r-md flex items-center justify-center shadow-sm bg-white hover:bg-gray-50">
              <SettingsDropdown />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-around text-center py-2 border-t border-gray-100 text-sm text-gray-700">
        <div>
          <p className="font-semibold">{user.totalContributions ?? 0}</p>
          <p className="text-xs">{t('mobile_profile_overview.stats.contributions')}</p>
        </div>
        <div>
          <p className="font-semibold">0</p>
          <p className="text-xs">{t('mobile_profile_overview.stats.followers')}</p>
        </div>
        <div>
          <p className="font-semibold">0</p>
          <p className="text-xs">{t('mobile_profile_overview.stats.following')}</p>
        </div>
      </div>
    </div>
  );
}
