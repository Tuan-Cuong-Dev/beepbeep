'use client';

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
      // ✅ Trường hợp chưa đăng nhập → dùng localStorage hoặc mặc định
      if (!user) {
        const localLang = localStorage.getItem('language') || 'vi';
        const localCurrency = localStorage.getItem('currency') || 'VND';

        if (i18n.language !== localLang) {
          i18n.changeLanguage(localLang);
        }

        document.documentElement.lang = localLang;
        localStorage.setItem('currency', localCurrency);
        return;
      }

      // ✅ Trường hợp preferences chưa load (tránh chạy sớm)
      if (preferences === null || preferences === undefined) {
        return;
      }

      // ✅ Nếu đã có preferences → áp dụng
      if (preferences.language && preferences.currency) {
        const prefLang = preferences.language;
        const prefCurrency = preferences.currency;

        if (i18n.language !== prefLang) {
          i18n.changeLanguage(prefLang);
        }

        document.documentElement.lang = prefLang;
        localStorage.setItem('language', prefLang);
        localStorage.setItem('currency', prefCurrency);
        return;
      }

      // ✅ Nếu preferences trống → detect từ API nội bộ
      try {
        const res = await fetch('/api/geo'); // 🔁 dùng API nội bộ để tránh CORS
        const data = await res.json();
        const region = data?.country_code || 'US';
        const language = countryToLanguageMap[region] || 'en';
        const currency = regionCurrencyMap[region] || 'USD';

        i18n.changeLanguage(language);
        document.documentElement.lang = language;
        localStorage.setItem('language', language);
        localStorage.setItem('currency', currency);

        await updatePreferences({ language, region, currency });
      } catch (err) {
        console.warn('🌐 Failed to auto-detect language or region:', err);
      }
    };

    applyLanguage();
  }, [user, preferences, updatePreferences]);
}
