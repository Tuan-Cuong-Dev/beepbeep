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
  { key: 'englishUS', value: 'en', code: 'US', flag: '🇺🇸' },
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
  { label: 'USD', name: 'United States Dollar', region: 'US' },
  { label: 'VND', name: 'Vietnamese Dong', region: 'VN' },
  { label: 'GBP', name: 'British Pound Sterling', region: 'GB' },
  { label: 'JPY', name: 'Japanese Yen', region: 'JP' },
  { label: 'CNY', name: 'Chinese Yuan', region: 'CN' },
  { label: 'KRW', name: 'South Korean Won', region: 'KR' },
  { label: 'RUB', name: 'Russian Ruble', region: 'RU' },
  { label: 'EUR', name: 'Euro', region: 'EU' }, // chung cho FR, DE, IT, ES, PT
  { label: 'SAR', name: 'Saudi Riyal', region: 'SA' },
];

// Region to default currency mapping
const regionCurrencyMap: Record<string, string> = {
  US: 'USD',
  VN: 'VND',
  GB: 'GBP',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  RU: 'RUB',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  SA: 'SAR',
};

export default function Preferences({ onClose }: PreferencesProps) {
  const [activeTab, setActiveTab] = useState<'region' | 'currency'>('region');
  const { user } = useUser();
  const { preferences, updatePreferences, loading, updating } = usePreferences(user?.uid);
  const { t } = useTranslation('common');

  const handleRegionChange = async (lang: string, region: string) => {
    i18n.changeLanguage(lang);
    const defaultCurrency = regionCurrencyMap[region];
    await updatePreferences({ language: lang, region, currency: defaultCurrency });
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
              {regions.map((region) => {
                const isActive =
                  preferences?.language === region.value &&
                  preferences?.region === region.code;

                return (
                  <button
                    key={region.code}
                    onClick={() => handleRegionChange(region.value, region.code)}
                    className={`p-2 rounded-lg border transition ${
                      isActive
                        ? 'bg-[#00d289] text-white font-semibold'
                        : 'hover:bg-[#00d289]'
                    }`}
                    disabled={updating}
                  >
                    {t(region.key)} {region.flag}
                  </button>
                );
              })}
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
                  className={`p-2 rounded-lg border transition ${
                    preferences?.currency === currency.label
                      ? 'bg-[#00d289] text-white font-semibold'
                      : 'hover:bg-[#00d289]'
                  }`}
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
