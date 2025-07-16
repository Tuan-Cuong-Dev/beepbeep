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
    if (!user) {
      if (i18n.language !== 'vi') {
        i18n.changeLanguage('vi');
      }

      // 🔧 Cập nhật luôn document.documentElement lang nếu cần
      document.documentElement.lang = 'vi';

      // ✅ Thêm đoạn set mặc định vào localStorage hoặc context nếu có
      localStorage.setItem('currency', 'VND');
      return;
    }

    if (!preferences?.language || !preferences?.currency) {
      (async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          const region = data?.country_code || 'US';
          const language = countryToLanguageMap[region] || 'en';
          const currency = regionCurrencyMap[region] || 'USD';

          i18n.changeLanguage(language);
          await updatePreferences({ language, region, currency });
        } catch (err) {
          console.warn('Failed to auto-detect language', err);
        }
      })();
    }
  }, [user, preferences, updatePreferences]);
}

