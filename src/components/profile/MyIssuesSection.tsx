'use client';

import { useTranslation } from 'react-i18next';

interface Issue {
  title: string;
  status: string;
  location?: string;
  reportedAt?: string;
}

interface MyIssuesSectionProps {
  issues: Issue[];
}

export default function MyIssuesSection({ issues }: MyIssuesSectionProps) {
  const { t } = useTranslation('common');

  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">{t('my_issues_section.title')}</h2>
      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">{t('my_issues_section.no_issues')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">{t('my_issues_section.table.title')}</th>
                <th className="p-2 border">{t('my_issues_section.table.status')}</th>
                <th className="p-2 border">{t('my_issues_section.table.location')}</th>
                <th className="p-2 border">{t('my_issues_section.table.reported_at')}</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2 border-r">{issue.title}</td>
                  <td className="p-2 border-r capitalize">{issue.status}</td>
                  <td className="p-2 border-r">{issue.location || t('my_issues_section.na')}</td>
                  <td className="p-2">{issue.reportedAt || t('my_issues_section.na')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
  