'use client';

import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function ActivityFeed() {
  const { t } = useTranslation('common');

  return (
    <div className="bg-white p-6 rounded shadow-sm flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-3">
        {t('activity_feed.title')}
      </h2>
      <p className="text-gray-700 mb-4 text-center">
        {t('activity_feed.description')}
      </p>
    </div>
  );
}
