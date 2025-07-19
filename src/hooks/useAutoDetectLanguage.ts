// hooks/useAutoDetectLanguage.ts
import { useEffect } from 'react';
import i18n from '@/src/i18n';

const countryToLanguageMap: Record<string, string> = {
  VN: 'vi',
  US: 'en',
  GB: 'en',
  JP: 'ja',
  CN: 'zh',
  KR: 'ko',
  RU: 'ru',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  ES: 'es',
  PT: 'pt',
  SA: 'ar',
};

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

export function useAutoDetectLanguage({
  preferences,
  updatePreferences,
  user,
}: {
  preferences: any;
  updatePreferences: (data: any) => Promise<void>;
  user?: { uid: string } | null;
}) {
  useEffect(() => {
  const applyLanguage = async () => {
    if (!user) {
      if (i18n.language !== 'vi') {
        i18n.changeLanguage('vi');
      }
      document.documentElement.lang = 'vi';
      localStorage.setItem('currency', 'VND');
      return;
    }

    // Nếu user đã có preferences → dùng ngay
    if (preferences?.language && preferences?.currency) {
      if (i18n.language !== preferences.language) {
        i18n.changeLanguage(preferences.language);
        document.documentElement.lang = preferences.language;
      }
      localStorage.setItem('currency', preferences.currency);
      return;
    }

    // Nếu chưa có preferences → auto detect
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      const region = data?.country_code || 'US';
      const language = countryToLanguageMap[region] || 'en';
      const currency = regionCurrencyMap[region] || 'USD';

      i18n.changeLanguage(language);
      document.documentElement.lang = language;
      localStorage.setItem('currency', currency);

      await updatePreferences({ language, region, currency });
    } catch (err) {
      console.warn('Failed to auto-detect language', err);
    }
  };

  applyLanguage();
}, [user, preferences, updatePreferences]);

}

