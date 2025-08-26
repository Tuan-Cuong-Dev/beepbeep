// 📁 components/profile/MyIssuesSectionContainer.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/hooks/useAuth';
import { useMyReportedIssues } from '@/src/hooks/useMyReportedIssues';
import MyIssuesSection from './MyIssuesSection';

export default function MyIssuesSectionContainer() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const { issues, loading } = useMyReportedIssues(uid);

  if (!uid) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t('profiles_page_content.please_login', 'Vui lòng đăng nhập để xem sự cố bạn đã báo.')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t('profiles_page_content.loading_my_issues', 'Đang tải sự cố của bạn…')}
      </div>
    );
  }

  return <MyIssuesSection issues={issues} />;
}
