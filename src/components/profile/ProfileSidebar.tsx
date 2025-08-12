// Bắt đầu thiết kế cái này từ 12.08.2025
// components/profile/ProfileSidebar.tsx

'use client';

import {
  FaImage, FaPen, FaGlobeAsia, FaMapMarkerAlt, FaCalendarAlt,
} from 'react-icons/fa';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';
import BusinessAboutSection from '../my-business/about/BusinessAboutSection';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

interface ProfileSidebarProps {
  // ✅ NEW: truyền từ parent
  businessId?: string;
  businessType?: BusinessType;

  // existing
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;
}

export default function ProfileSidebar({
  businessId,
  businessType,
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,
}: ProfileSidebarProps) {
  const { t } = useTranslation('common');

  return (
    <div className="w-full space-y-6 rounded-lg">

      {/* Business About Section */}
      {businessId && businessType ? (
        <BusinessAboutSection businessId={businessId} businessType={businessType} />
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            {t('business_about.not_found') /* hoặc một câu nhắc chọn doanh nghiệp */}
          </p>
        </div>
      )}

      {/* Intro */}
      <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-gray-700 hidden md:block">
        <h2 className="text-base font-semibold mb-3">{t('profile_sidebar.intro')}</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-500 w-4 h-4" />
            {location}
          </li>
          <li className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-500 w-4 h-4" />
            {t('profile_sidebar.joined_in')} {joinedDate}
          </li>
          <li className="flex items-center gap-2">
            <FaGlobeAsia className="text-gray-500 w-4 h-4" />
            {helpfulVotes} {t('profile_sidebar.helpful_votes')}
          </li>
          <li className="text-[#00d289] hover:underline cursor-pointer font-medium">
            {t('profile_sidebar.feedback_prompt')}
          </li>
        </ul>
      </div>

      {/* Share actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm hidden md:block">
        <h2 className="text-base font-semibold mb-3">{t('profile_sidebar.feedback_prompt')}</h2>
        <div className="text-sm text-gray-700 space-y-3">
          <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2 cursor-pointer">
            <FaImage className="w-4 h-4" />
            {t('profile_sidebar.post_photos')}
          </p>
          <p className="flex items-center gap-2 font-semibold hover:underline underline-offset-2 cursor-pointer">
            <FaPen className="w-4 h-4" />
            {t('profile_sidebar.write_review')}
          </p>
        </div>
      </div>

    </div>
  );
}