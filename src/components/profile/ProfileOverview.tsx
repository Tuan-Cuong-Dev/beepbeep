'use client';

import { useEffect, useState } from 'react';
import DesktopProfileOverview from './DesktopProfileOverview';
import MobileProfileOverview from './MobileProfileOverview';

interface ProfileOverviewProps {
  /** uid của profile cần hiển thị */
  userId: string;
  /** dữ liệu đã load sẵn từ parent (nếu có) */
  userPrefetched?: any | null;
  /** cờ để hiển thị nút Edit/Settings */
  isOwner?: boolean;
  /** callback khi bấm Edit */
  onEditProfile?: () => void;
}

export default function ProfileOverview({
  userId,
  userPrefetched,
  isOwner = false,
  onEditProfile,
}: ProfileOverviewProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!userId) {
    return (
      <div className="bg-white p-4 text-sm text-gray-600">
        Không tìm thấy userId để hiển thị profile.
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileProfileOverview
          userId={userId}
          userPrefetched={userPrefetched}
          isOwner={isOwner}
          onEditProfile={onEditProfile}
        />
      ) : (
        <DesktopProfileOverview
          userId={userId}
          userPrefetched={userPrefetched}
          isOwner={isOwner}
          onEditProfile={onEditProfile}
        />
      )}
    </>
  );
}
