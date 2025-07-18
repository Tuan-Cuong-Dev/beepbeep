'use client';

import Image from 'next/image';
import { useAuth } from '@/src/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import SettingsDropdown from './SettingsDropdown';
import { useTranslation } from 'react-i18next';

export default function MobileProfileOverview() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUser(snap.data());
    };
    fetchUser();
  }, [currentUser]);

  if (!user) return <div className="p-4">{t('mobile_profile_overview.loading')}</div>;

  return (
    <div className="bg-white">
      {/* Cover Image */}
      <div className="relative w-full h-24">
        <Image
          src={user.coverURL || '/assets/images/Cover_desktop.jpg'}
          alt="Cover"
          fill
          className="object-cover"
        />
      </div>

      {/* Profile Row */}
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md relative">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-lg">?</div>
            )}
          </div>

          <div className="text-sm max-w-[180px] sm:max-w-xs truncate">
            <p className="font-semibold">{user.name || t('mobile_profile_overview.unknown_name')}</p>
            <p className="text-gray-400 text-xs truncate">
              {t('mobile_profile_overview.role')} {user.role || 'Customer'}
            </p>
            <p className="text-gray-500 truncate">
              {user.address || t('mobile_profile_overview.default_address')}
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center">
          <button className="flex items-center px-3 h-8 text-sm border border-gray-300 rounded-l-md shadow-sm hover:bg-gray-50">
            {t('mobile_profile_overview.edit_profile')}
          </button>
          <div className="h-8 border border-l-0 border-gray-300 rounded-r-md flex items-center justify-center px-2 hover:bg-gray-50">
            <SettingsDropdown />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-around text-center py-2 border-t border-gray-100 text-sm text-gray-700">
        <div>
          <p className="font-semibold">0</p>
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
