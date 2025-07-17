'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthService } from '@/src/components/auth/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import {
  FaTimes, FaPencilAlt, FaUser, FaCalendarAlt, FaEnvelope, FaBuilding,
  FaCog, FaUsers, FaDollarSign, FaMapMarkerAlt
} from 'react-icons/fa';
import { useUser } from '@/src/context/AuthContext';
import { IconType } from 'react-icons';
import { db } from '@/src/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';

interface UserSidebarProps {
  user: any;
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
    { icon: FaUsers, label: t('user_sidebar.menu.agent_dashboard'), path: '/my-business/agent' },
    { icon: FaDollarSign, label: t('user_sidebar.menu.earnings'), path: '/my-business/earnings' },
    { icon: faFileContract, label: t('user_sidebar.menu.request_payment'), path: '/my-business/request-payment' },
  ];

  const getCommonItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      { icon: FaPencilAlt, label: t('user_sidebar.menu.write_review'), onClick: () => setShowComingSoon(true) },
      { divider: true },
      { icon: FaMapMarkerAlt, label: t('user_sidebar.menu.add_to_map'), path: '/contribute' },
      { divider: true },
      { icon: FaUser, label: t('user_sidebar.menu.profile'), path: '/profiles' },
    ];

    if (!['support', 'technician', 'technician_assistant', 'technician_partner'].includes(normalizedRole)) {
      items.push({ icon: FaCalendarAlt, label: t('user_sidebar.menu.bookings'), path: '/bookings' });
    }

    items.push(
      { icon: FaEnvelope, label: t('user_sidebar.menu.messages'), path: '/messages' },
      { icon: FaBuilding, label: t('user_sidebar.menu.my_business'), path: '/my-business' },
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
      <div className={`fixed top-0 right-0 z-[100] w-80 max-w-full h-[100dvh] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-xl">
            <FaTimes />
          </button>
          <img
            src={user?.photoURL || "/assets/images/technician.png"}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
          <p className="mt-2 text-gray-600 text-sm">{t('user_sidebar.welcome')}</p>
          <p className="font-semibold text-gray-800 mt-1 text-center">{user?.displayName || "User"}</p>
          {normalizedRole === 'agent' && !agentDisabled && (
            <div className="mt-4 space-y-1 text-sm text-gray-600 text-center">
              <p>{t('user_sidebar.total_earnings')}: <b>${agentStats.total.toFixed(2)}</b></p>
              <p>{t('user_sidebar.pending_payment')}: <b>${agentStats.pending.toFixed(2)}</b></p>
            </div>
          )}
          {normalizedRole === 'agent' && agentDisabled && (
            <p className="mt-4 text-red-500 text-sm">{t('user_sidebar.account_disabled')}</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {menuItems.map((item, index) =>
            'divider' in item ? (
              <hr key={index} className="my-2 border-gray-200" />
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
                className={`flex items-center space-x-3 w-full text-left rounded-lg px-3 py-2 transition ${pathname === item.path ? 'bg-[#00d289] text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
              >
                {'icon' in item && (
                  typeof item.icon === 'function' ? (
                    <item.icon />
                  ) : (
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  )
                )}
                <span>{item.label}</span>
              </button>
            )
          )}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="w-full border border-gray-300 rounded-lg py-2 text-black hover:bg-[#00d289] transition"
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
