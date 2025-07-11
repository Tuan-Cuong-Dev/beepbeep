'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports để giảm tải ban đầu
const DesktopProfile = dynamic(() => import('./DesktopProfileOverview'));
const MobileProfile = dynamic(() => import('./MobileProfileOverview'));

export default function ProfileOverview() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkSize(); // Gọi lần đầu
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return isMobile ? <MobileProfile /> : <DesktopProfile />;
}
