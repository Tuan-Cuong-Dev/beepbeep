'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthService } from '@/src/components/auth/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import {
  FaTimes, FaPencilAlt, FaUser, FaCalendarAlt, FaEnvelope,
  FaCog, FaUsers, FaDollarSign, FaMapMarkerAlt
} from 'react-icons/fa';
import { RiDashboardLine } from 'react-icons/ri';
import { useUser } from '@/src/context/AuthContext';
import { IconType } from 'react-icons';
import { db } from '@/src/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';
import { User as AppUser } from '@/src/lib/users/userTypes';
import QRCode from 'react-qr-code';
import { generateReferralCode } from '@/src/lib/users/generateReferralCode';

// ✅ Quick action: Báo hỏng xe
import ReportVehicleIssueButton from '@/src/components/public-vehicle-issues/ReportVehicleIssueButton';

interface UserSidebarProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
}

type MenuItem =
  | { divider: true }
  | {
      icon: IconType | typeof faFileContract;
      label: string;
      path?: string;
      onClick?: () => void;
    };

const UserSidebar: React.FC<UserSidebarProps> = ({ user, isOpen, onClose }) => {
  const { signOutUser } = useAuthService();
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useUser();
  const { t } = useTranslation();

  const [agentStats, setAgentStats] = useState({ total: 0, pending: 0 });
  const [agentDisabled, setAgentDisabled] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const normalizedRole = (role || '').toLowerCase();

  useEffect(() => {
    if (normalizedRole !== 'agent' || !user?.uid) return;
    const q = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      let pending = 0;
      snap.forEach(doc => {
        const data = doc.data();
        const amount = data.agentCommission || 0;
        total += amount;
        if (!data.agentCommissionPaid) pending += amount;
      });
      setAgentStats({ total, pending });
    });
    return () => unsub();
  }, [normalizedRole, user]);

  useEffect(() => {
    if (normalizedRole !== 'agent' || !user?.uid) return;
    const checkAgent = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const userData = snap.data();
      if (userData?.status === 'disabled') setAgentDisabled(true);
    };
    checkAgent();
  }, [normalizedRole, user]);

  if (!isOpen) return null;

  const footerItem: MenuItem = {
    icon: FaCog,
    label: t('user_sidebar.menu.account_info'),
    path: '/account',
  };

  const agentItems: MenuItem[] = [
    { icon: FaUsers, label: t('user_sidebar.menu.agent_dashboard'), path: '/dashboard/agent' },
    { icon: FaDollarSign, label: t('user_sidebar.menu.earnings'), path: '/dashboard/earnings' },
    { icon: faFileContract, label: t('user_sidebar.menu.request_payment'), path: '/dashboard/request-payment' },
  ];

  const getCommonItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      { icon: FaPencilAlt, label: t('user_sidebar.menu.write_review'), onClick: () => setShowComingSoon(true) },
      { divider: true },
      { icon: FaMapMarkerAlt, label: t('user_sidebar.menu.add_to_map'), path: '/contribute' },
      { divider: true },
      { icon: FaUser, label: t('user_sidebar.menu.profile'), path: '/profile' },
    ];

    if (!['support', 'technician', 'technician_assistant', 'technician_partner'].includes(normalizedRole)) {
      items.push({ icon: FaCalendarAlt, label: t('user_sidebar.menu.bookings'), path: '/bookings' });
    }

    items.push(
      { icon: FaEnvelope, label: t('user_sidebar.menu.messages'), path: '/messages' },
      { icon: RiDashboardLine, label: t('user_sidebar.menu.dashboard'), path: '/dashboard' },
      { divider: true }
    );

    return items;
  };

  const getMenuItems = (): MenuItem[] => {
    if (normalizedRole === 'agent') {
      return agentDisabled
        ? [...getCommonItems(), footerItem]
        : [...getCommonItems(), ...agentItems, { divider: true }, footerItem];
    }
    return [...getCommonItems(), footerItem];
  };

  const menuItems = getMenuItems();

  return (
    <>
      <div
        className={`fixed top-0 right-0 z-[100] w-80 max-w-full h-[100dvh]
        bg-white/95 backdrop-blur-md shadow-2xl rounded-l-2xl flex flex-col
        transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-4 border-b relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-lg text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <FaTimes />
          </button>

          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={user?.photoURL || "/assets/images/technician.png"}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">{t('user_sidebar.welcome')}</p>
            <p className="font-semibold text-gray-900 mt-0.5 text-center leading-tight">
              {user?.name || "User"}
            </p>

            {user.contributionPoints !== undefined && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {t('user_sidebar.points')}: <b>{user.contributionPoints}</b>
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          
          {/* ✅ Quick Action */}
            <div className="mt-3 w-full text-center">
              <ReportVehicleIssueButton />
              {/* hint phụ (nhẹ nhàng): */}
              <p className="mt-1 text-[11px] text-gray-500 text-center">
                {t('user_sidebar.quick_hint')}
              </p>
            </div>
              
          <hr className="my-2 border-gray-200/70" />

          {menuItems.map((item, index) =>
            'divider' in item ? (
              <hr key={index} className="my-2 border-gray-200/70" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  if (item.path) {
                    router.push(item.path);
                    onClose();
                  } else {
                    item.onClick?.();
                  }
                }}
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 transition
                  ${pathname === item.path
                    ? 'bg-[#00d289] text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {'icon' in item &&
                  (typeof item.icon === 'function' ? (
                    <item.icon />
                  ) : (
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  ))}
                <span className="text-sm">{item.label}</span>
              </button>
            )
          )}

          <hr className="my-2 border-gray-200/70" />

          {user.idNumber && (
            <div className="p-4 border rounded-xl bg-white">
              <p className="text-xs text-gray-500 mb-1 text-center">{t('user_sidebar.referral_code')}</p>
              <p className="text-sm font-semibold text-[#00d289] text-center">
                {generateReferralCode(user.idNumber)}
              </p>
              <div className="flex justify-center mt-2 bg-white p-2 rounded">
                <QRCode value={generateReferralCode(user.idNumber) || ''} size={96} />
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="w-full border border-gray-300 rounded-xl py-2 text-gray-800 hover:bg-[#00d289] hover:text-white transition"
          >
            {t('user_sidebar.menu.sign_out')}
          </button>
        </div>
      </div>

      <NotificationDialog
        open={showComingSoon}
        type="info"
        title={t('user_sidebar.coming_soon.title')}
        description={t('user_sidebar.coming_soon.description')}
        onClose={() => setShowComingSoon(false)}
      />
    </>
  );
};

export default UserSidebar;
