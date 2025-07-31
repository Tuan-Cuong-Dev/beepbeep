'use client';

import { TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  suggestions: TechnicianSuggestion[];
}

export default function TechnicianSuggestionList({ suggestions }: Props) {
  const { t } = useTranslation('common');

  if (!suggestions?.length) return <p>{t('technician_suggestion_list.no_suggestions')}</p>;

  return (
    <ul className="space-y-3">
      {suggestions.map((item, index) => (
        <li key={index} className="border rounded p-2 bg-gray-50">
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-gray-600">{item.comment}</p>
          <p className="text-xs text-gray-400">
            {item.timestamp.toDate().toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}