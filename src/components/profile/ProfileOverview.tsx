'use client';

import { useEffect, useState } from 'react';
import DesktopProfileOverview from './DesktopProfileOverview';
import MobileProfileOverview from './MobileProfileOverview';

export default function ProfileOverview() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {isMobile ? <MobileProfileOverview /> : <DesktopProfileOverview />}
    </>
  );
}
