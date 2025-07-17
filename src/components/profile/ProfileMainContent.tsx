'use client';

import { useTranslation } from 'react-i18next';
import MyVehiclesSection from '../personalVehicles/MyVehiclesSection';
import MyInsuranceSection from './MyInsuranceSection';
import MyIssuesSection from './MyIssuesSection';

interface ProfileMainContentProps {
  activeTab: 'profile' | 'vehicles' | 'insurance' | 'issues';
}

export default function ProfileMainContent({ activeTab }: ProfileMainContentProps) {
  const { t } = useTranslation('common');

  return (
    <div className="w-full md:w-2/3 mt-6 md:mt-0 space-y-6">
      {activeTab === 'profile' && (
        <div className="bg-white p-4 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            {t('profile_main_content.welcome_title')}
          </h2>
          <p className="text-gray-700 text-sm">
            {t('profile_main_content.welcome_description')}
          </p>
        </div>
      )}
      {activeTab === 'vehicles' && <MyVehiclesSection />}
      {activeTab === 'insurance' && <MyInsuranceSection />}
      {activeTab === 'issues' && <MyIssuesSection issues={[]} />}
    </div>
  );
}
