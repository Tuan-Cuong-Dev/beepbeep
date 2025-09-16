// Phần làm đẹp cho người dùng, Cường chưa làm
// Date : 16/09/2025

'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/src/components/ui/dropdown-menu';
import { FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function SettingsDropdown() {
  const { t } = useTranslation('common');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span title={t('settings_dropdown.settings')}>
          <FiSettings className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-700" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="w-full">✏️ {t('settings_dropdown.edit_profile')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit-photo" className="w-full">🖼️ {t('settings_dropdown.edit_photo')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit-cover" className="w-full">🌄 {t('settings_dropdown.edit_cover')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account" className="w-full">👤 {t('settings_dropdown.account_info')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings" className="w-full">⚙️ {t('settings_dropdown.account_settings')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/subscriptions" className="w-full">💳 {t('settings_dropdown.subscriptions')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/payments" className="w-full">💰 {t('settings_dropdown.payments')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/connectgoogledriver" className="w-full">🔗 {t('settings_dropdown.connect_drive')}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
