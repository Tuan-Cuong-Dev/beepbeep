'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaTimes,
  FaGlobe,
  FaHome,
  FaInfoCircle,
  FaPhone,
  FaShieldAlt,
} from 'react-icons/fa';
import Preferences from '@/src/components/landingpage/Preferences';
import { useTranslation } from 'react-i18next';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const { t } = useTranslation('common');

  const handleOpenPreferences = () => {
    setShowPreferences(true);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="font-sans fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-[100] p-5
                   transform transition-transform duration-300 ease-in-out translate-x-0"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-lg">
            <FaTimes />
          </button>

          {/* Preferences Trigger */}
          <div
            className="flex items-center text-gray-800 space-x-2 font-semibold text-lg mb-8 cursor-pointer hover:text-[#00d289] transition"
            onClick={handleOpenPreferences}
          >
            <FaGlobe />
            <span>{t('preferences_sidebar.label')}</span>
          </div>

          <ul className="space-y-4 text-gray-800">
            <li className="flex items-center space-x-3 hover:text-[#00d289]">
              <FaHome />
              <Link href="/" onClick={onClose}>
                {t('navigation.home')}
              </Link>
            </li>
            <hr />
            <li className="flex items-center space-x-3 hover:text-[#00d289]">
              <FaInfoCircle />
              <Link href="/about" onClick={onClose}>
                {t('navigation.about')}
              </Link>
            </li>
            <hr />
            <li className="flex items-center space-x-3 hover:text-[#00d289]">
              <FaPhone />
              <Link href="/contact" onClick={onClose}>
                {t('navigation.contact')}
              </Link>
            </li>
            <hr />
            <li className="flex items-center space-x-3 hover:text-[#00d289]">
              <FaShieldAlt />
              <Link href="/policy" onClick={onClose}>
                {t('navigation.policy')}
              </Link>
            </li>
          </ul>
        </div>
      )}

      {showPreferences && (
        <Preferences onClose={() => setShowPreferences(false)} />
      )}
    </>
  );
}
