// src/hooks/useTranslation.ts
'use client';
import { useTranslation as useTranslationBase } from 'react-i18next';

export const useTranslation = () => {
  return useTranslationBase('common');
};
