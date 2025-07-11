'use client';

import Image from 'next/image';
import { useAuth } from '@/src/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import SettingsDropdown from './SettingsDropdown';

export default function MobileProfileOverview() {
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

  if (!user) return <div className="p-4">Loading...</div>;

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

          <div className="text-sm">
            <p className="font-semibold">{user.name || 'Unknown'}</p>
            <p className="text-gray-500">{user.address || 'Da Nang'}</p>
            <p className="text-gray-400 text-xs">Joined {user.joinedDate || 'Mar 2025'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center">
        <button className="flex items-center px-3 h-8 text-sm border border-gray-300 rounded-l-md shadow-sm hover:bg-gray-50">
            Edit profile
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
          <p className="text-xs">Contributions</p>
        </div>
        <div>
          <p className="font-semibold">0</p>
          <p className="text-xs">Followers</p>
        </div>
        <div>
          <p className="font-semibold">0</p>
          <p className="text-xs">Following</p>
        </div>
      </div>
    </div>
  );
}
