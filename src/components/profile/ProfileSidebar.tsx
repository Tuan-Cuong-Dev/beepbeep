// Bắt đầu thiết kế cái này từ 12.08.2025
// components/profile/ProfileSidebar.tsx

'use client';

import {
  FaImage, FaPen, FaGlobeAsia, FaMapMarkerAlt, FaCalendarAlt,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import BusinessAboutSection from '../my-business/about/BusinessAboutSection';
// ⬇️ Đảm bảo đúng path/tên file bạn đã tạo (Section, không phải Sections)
import ServicesAboutSection from '../my-business/about/ServicesAboutSections';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

interface ProfileSidebarProps {
  // ✅ NEW: truyền từ parent
  businessId?: string;
  businessType?: BusinessType;
  currentUserId?: string; // 👈 thêm

  // existing
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;
}

export default function ProfileSidebar({
  businessId,
  businessType,
  currentUserId, // 👈 nhận
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,
}: ProfileSidebarProps) {
  const { t } = useTranslation('common');

  return (
    <div className="w-full space-y-6 rounded-lg">
      {/* Business About Section */}
      {businessId && businessType ? (
        <>
          <BusinessAboutSection businessId={businessId} businessType={businessType} />
          {/* Nếu services lưu theo businessId thì prop businessId là đủ.
              Nếu services lưu theo userId, truyền thêm currentUserId như dưới. */}
            <ServicesAboutSection businessId={businessId} userId={currentUserId} statusIn={['active','pending','inactive']} />
        </>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">{t('business_about.not_found')}</p>
        </div>
      )}
    </div>
  );
}
