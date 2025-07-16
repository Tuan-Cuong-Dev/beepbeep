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

export function useAutoDetectLanguage() {
  useEffect(() => {
    const detectAndSetLanguage = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const countryCode = data?.country_code;
        const lang = countryToLanguageMap[countryCode] || 'en';

        if (i18n.language !== lang) {
          i18n.changeLanguage(lang);
        }
      } catch (error) {
        console.error('Failed to detect country for language setting', error);
      }
    };

    detectAndSetLanguage();
  }, []);
}
