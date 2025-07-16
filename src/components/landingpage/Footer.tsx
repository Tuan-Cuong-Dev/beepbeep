'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-[#00d289] text-white text-sm py-4 text-center w-full">
      <div>© 2025 Workman. {t('footer.rights')}</div>
      <div className="mt-1 space-x-3">
        <Link href="/about" className="underline">{t('footer.about')}</Link>
        <Link href="/contact" className="underline">{t('footer.contact')}</Link>
        <Link href="/policy" className="underline">{t('footer.policy')}</Link>
      </div>
    </footer>
  );
}
