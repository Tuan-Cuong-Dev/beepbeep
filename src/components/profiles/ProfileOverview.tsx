'use client';

import Image from 'next/image';
import { useAuth } from '@/src/components/users/useAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { FiSettings } from 'react-icons/fi';


export default function ProfileOverview() {
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
    <div className="relative bg-white shadow-sm">
      {/* Cover Image */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 lg:h-80">
        <Image
          src={user.coverURL || '/assets/images/Cover2.jpg'}
          alt="Cover"
          fill
          className="object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between bg-white rounded-lg p-4 shadow-md gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative">
              {user.photoURL ? (
                <Image src={user.photoURL} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-2xl">?</div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold">{user.name || 'Unknown'}</h1>
              <p className="text-gray-500 text-sm">{user.username }</p>

              {/* Đồng bộ với phần Intro */}
              <div className="text-sm text-gray-600">
                <p>{user.address || 'Da Nang, Vietnam'}</p>
                <p>Joined {user.joinedDate || 'Mar 2025'}</p>
                <p>{user.helpfulVotes || 0} helpful votes</p>
              </div>
            </div>
          </div>


          {/* Statistics & Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-between">
            <div className="flex gap-6 text-center text-sm sm:text-base">
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-600">Contributions</p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-600">Followers</p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-gray-600">Following</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="border px-4 py-1.5 rounded text-sm font-medium shadow-sm whitespace-nowrap">
                Edit profile
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700" title="Settings">
                <FiSettings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
