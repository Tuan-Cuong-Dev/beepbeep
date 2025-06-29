'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import i18n from '@/src/i18n';
import { useUser } from '@/src/context/AuthContext';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useTranslation } from 'react-i18next';

interface PreferencesProps {
  onClose: () => void;
}

const regions = [
  { key: 'vietnam', value: 'vi', code: 'VN', flag: '🇻🇳' },
  { key: 'englishUK', value: 'en', code: 'GB', flag: '🇬🇧' },
  { key: 'japan', value: 'ja', code: 'JP', flag: '🇯🇵' },
  { key: 'china', value: 'zh', code: 'CN', flag: '🇨🇳' },
  { key: 'southKorea', value: 'ko', code: 'KR', flag: '🇰🇷' },
  { key: 'russia', value: 'ru', code: 'RU', flag: '🇷🇺' },
  { key: 'france', value: 'fr', code: 'FR', flag: '🇫🇷' },
  { key: 'germany', value: 'de', code: 'DE', flag: '🇩🇪' },
  { key: 'italy', value: 'it', code: 'IT', flag: '🇮🇹' },
  { key: 'spain', value: 'es', code: 'ES', flag: '🇪🇸' },
  { key: 'portugal', value: 'pt', code: 'PT', flag: '🇵🇹' },
  { key: 'saudiArabia', value: 'ar', code: 'SA', flag: '🇸🇦' },
];

const currencies = [
  { label: 'VND', name: 'Vietnamese Dong' },
  { label: 'GBP', name: 'British Pound Sterling' },
  { label: 'JPY', name: 'Japanese Yen' },
  { label: 'CNY', name: 'Chinese Yuan' },
  { label: 'KRW', name: 'South Korean Won' },
  { label: 'RUB', name: 'Russian Ruble' },
  { label: 'EUR', name: 'Euro' },
  { label: 'SAR', name: 'Saudi Riyal' },
];

export default function Preferences({ onClose }: PreferencesProps) {
  const [activeTab, setActiveTab] = useState('region');
  const { user } = useUser();
  const { preferences, updatePreferences, loading, updating } = usePreferences(user?.uid);
  const { t } = useTranslation('common');

  const handleRegionChange = async (lang: string, region: string) => {
    i18n.changeLanguage(lang);
    await updatePreferences({ language: lang, region });
  };

  const handleCurrencyChange = async (currency: string) => {
    await updatePreferences({ currency });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-lg relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-4">{t('preferences')}</h2>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          <button
            className={`pb-2 ${activeTab === 'region' ? 'border-b-2 border-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('region')}
          >
            {t('region_language')}
          </button>
          <button
            className={`pb-2 ${activeTab === 'currency' ? 'border-b-2 border-black font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('currency')}
          >
            {t('currency')}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading preferences...</p>
        ) : activeTab === 'region' ? (
          <div>
            <h3 className="text-lg font-medium mb-2">{t('select_region_language')}</h3>
            <div className="text-sm grid grid-cols-4 gap-3">
              {regions.map((region) => (
                <button
                  key={region.code}
                  onClick={() => handleRegionChange(region.value, region.code)}
                  className="p-2 rounded-lg border hover:bg-[#00d289] transition"
                  disabled={updating}
                >
                  {t(region.key)} {region.flag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-2">{t('select_currency')}</h3>
            <div className="text-sm grid grid-cols-4 gap-4">
              {currencies.map((currency) => (
                <button
                  key={currency.label}
                  onClick={() => handleCurrencyChange(currency.label)}
                  className="p-2 rounded-lg border hover:bg-[#00d289] transition"
                  disabled={updating}
                >
                  {currency.label} ({currency.name})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-4">
          {t('saved_notice')}
        </p>
      </div>
    </div>
  );
}
