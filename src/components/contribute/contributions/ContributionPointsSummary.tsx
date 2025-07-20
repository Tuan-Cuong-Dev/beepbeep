'use client';

import { useUser } from '@/src/context/AuthContext';
import { useTranslation, Trans } from 'react-i18next';

export default function ContributionPointsSummary() {
  const { user } = useUser();
  const { t } = useTranslation('common');

  if (!user) return null;

  const points = user.contributionPoints ?? 0;
  const total = user.totalContributions ?? 0;
  const contributionLevel = points >= 100 ? 3 : points >= 50 ? 2 : 1;

  return (
    <div className="bg-white shadow rounded p-4 border mb-4">
      <h3 className="text-lg font-bold mb-2">{t('contribution_points_summary.title')}</h3>
      <p>
        <Trans t={t} i18nKey="contribution_points_summary.points" values={{ points }} components={[<strong key="0" />]} />
      </p>
      <p>
        <Trans t={t} i18nKey="contribution_points_summary.total" values={{ total }} components={[<strong key="0" />]} />
      </p>
      <p>
        <Trans t={t} i18nKey="contribution_points_summary.level" values={{ contributionLevel }} components={[<strong key="0" />]} />
      </p>
    </div>
  );
}
