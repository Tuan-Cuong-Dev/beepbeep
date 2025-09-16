// Date : 16/09/2025
// Đã logic để hiện thị tab nào public và private + fallback publicProfiles + guest banner

'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import ProfileOverview from '@/src/components/profile/ProfileOverview';
import ProfileTabs, { TabType } from '@/src/components/profile/ProfileTabs';
import ProfileSidebar from '@/src/components/profile/ProfileSidebar';
import ProfileMainContent from '@/src/components/profile/ProfileMainContent';
import MyVehiclesSection from '@/src/components/personalVehicles/MyVehiclesSection';
import MyInsuranceSection from '@/src/components/profile/MyInsuranceSection';
import MyIssuesSectionContainer from '@/src/components/profile/MyIssuesSectionContainer';
import MyContributionsSection from '@/src/components/profile/MyContributionsSection';
import MyBusinessSection from '@/src/components/profile/MyBusinessSection';
import AgentShowcase from '@/src/components/showcase/AgentShowcase';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

const ALL_TABS: TabType[] = [
  'activityFeed',
  'showcase',
  'vehicles',
  'insurance',
  'issues',
  'contributions',
  'business',
];

const PUBLIC_TABS: TabType[] = ['activityFeed', 'showcase'];

export default function ProfilesPageContent() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [readOnlyPublic, setReadOnlyPublic] = useState<boolean>(false);
  const [notFoundPublic, setNotFoundPublic] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>('activityFeed');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // Lấy tab & uid từ query
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as TabType | null;
    const uidParam = searchParams?.get('uid');

    if (uidParam) {
      setProfileUserId(uidParam);
    } else if (currentUser?.uid) {
      setProfileUserId(currentUser.uid);
    } else {
      setProfileUserId(null);
    }

    if (tabParam && ALL_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, currentUser?.uid]);

  // Tải dữ liệu user của "profileUserId" (full → fallback public)
  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      setLoadingUser(true);
      setReadOnlyPublic(false);
      setNotFoundPublic(false);
      setUserData(null);

      if (!profileUserId) {
        setLoadingUser(false);
        return;
      }

      // 1) Thử đọc full profile (users/{uid})
      try {
        const ref = doc(db, 'users', profileUserId);
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) {
          setUserData(snap.data());
          setReadOnlyPublic(false);
          setLoadingUser(false);
          return;
        }
      } catch (_err) {
        // console.debug('[Profile] users read failed (may be permission-denied).');
      }

      // 2) Fallback: publicProfiles/{uid}
      try {
        const pref = doc(db, 'publicProfiles', profileUserId);
        const psnap = await getDoc(pref);
        if (!cancelled) {
          if (psnap.exists()) {
            setUserData(psnap.data());
            setReadOnlyPublic(true);
          } else {
            setUserData(null);
            setNotFoundPublic(true);
          }
        }
      } catch (_err2) {
        if (!cancelled) {
          setUserData(null);
          setNotFoundPublic(true);
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    };

    fetchUserData();
    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  // Xác định quyền xem của người đang truy cập
  const isOwnerRaw = !!(currentUser?.uid && profileUserId && currentUser.uid === profileUserId);
  // Nếu đang xem bản công khai (fallback) thì không cho quyền owner
  const isOwner = isOwnerRaw && !readOnlyPublic;

  const allowedTabs = (isOwner ? ALL_TABS : PUBLIC_TABS) as TabType[];

  // Nếu người xem không phải chủ account mà đang đứng ở tab private → chuyển về activityFeed
  useEffect(() => {
    if (!activeTab) return;
    if (!allowedTabs.includes(activeTab)) {
      const qs = new URLSearchParams();
      qs.set('tab', 'activityFeed');
      const uid = searchParams?.get('uid');
      if (uid) qs.set('uid', uid);
      router.replace(`?${qs.toString()}`);
      setActiveTab('activityFeed');
    }
  }, [activeTab, allowedTabs, router, searchParams]);

  // Đồng bộ URL khi đổi tab (giữ nguyên uid nếu có)
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;

    const qs = new URLSearchParams();
    qs.set('tab', tab);
    const uid = searchParams?.get('uid');
    if (uid) qs.set('uid', uid);

    router.push(`?${qs.toString()}`);
    setActiveTab(tab);
  };

  const businessTypeFromRole = useMemo<BusinessType | undefined>(() => {
    switch (userData?.role as string | undefined) {
      case 'company_owner': return 'rental_company';
      case 'private_provider': return 'private_provider';
      case 'agent': return 'agent';
      case 'technician_partner': return 'technician_partner';
      case 'intercity_bus': return 'intercity_bus';
      case 'vehicle_transport': return 'vehicle_transport';
      case 'tour_guide': return 'tour_guide';
      default: return undefined;
    }
  }, [userData?.role]);

  const businessId = userData?.companyId as string | undefined;

  // States hiển thị
  if (!profileUserId) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-lg bg-white p-6 border">
            <p className="text-gray-700">{t('profiles_page_content.no_user_found')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-lg bg-white p-6 border">
            <p className="text-gray-700">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Dữ liệu Overview: nếu không có thì render tối giản
  const overviewData = userData ?? { name: '—', role: 'Guest', address: '' };

  const showGuestBanner = !currentUser || readOnlyPublic;

  const showSidebarOnMobile = activeTab === 'activityFeed';

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header + Avatar */}
      <ProfileOverview
        userId={profileUserId}
        userPrefetched={overviewData}
        isOwner={isOwner}
        onEditProfile={() => router.push('/account/profile')}
      />

      {/* Guest banner: yêu cầu tạo tài khoản và quét lại QR */}
      {showGuestBanner && (
        <div className="bg-amber-50 border-y border-amber-200">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-amber-800 text-sm">
              {t(
                'profiles_page_content.guest_cta',
                'Bạn hãy tạo tài khoản và bắt đầu scan lại QR code. Việc đăng ký giúp bạn sử dụng tính năng báo lỗi khi sử dụng xe thuê.'
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-3 py-1.5 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700"
              >
                {t('auth.create_account', 'Tạo tài khoản')}
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-3 py-1.5 text-sm rounded-md border border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
              >
                {t('auth.login', 'Đăng nhập')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nếu không có public profile nào, nhắc nhẹ (không chặn trang) */}
      {notFoundPublic && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-2 text-gray-600 text-sm">
            {t('profiles_page_content.not_available', 'Hồ sơ công khai chưa được thiết lập. Một số thông tin có thể không hiển thị.')}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-t border-b sticky top-0 z-10">
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userId={profileUserId || undefined}
          allowedTabs={allowedTabs}      // chỉ hiển thị tab được phép
          canConfigure={!!isOwner}       // chỉ chủ tài khoản mới được cấu hình
        />
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar */}
        <aside
          className={`${showSidebarOnMobile ? 'block' : 'hidden'} md:block w-full md:flex-[1_1_33.333%] md:max-w-[33.333%]`}
        >
          <ProfileSidebar
            businessId={businessId}
            businessType={businessTypeFromRole}
            currentUserId={profileUserId}
            location={userData?.address || t('profiles_page_content.no_address')}
            joinedDate={userData?.joinedDate || '2025-01'}
            helpfulVotes={userData?.helpfulVotes || 0}
          />
        </aside>

        {/* Main tab content */}
        <section className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {/* Public */}
          {activeTab === 'activityFeed' && <ProfileMainContent activeTab="activityFeed" />}

          {activeTab === 'showcase' && (
            <AgentShowcase agentId={profileUserId} limitPerRow={12} onlyAvailable />
          )}

          {/* Private: chỉ chủ tài khoản mới xem được */}
          {isOwner && activeTab === 'vehicles' && <MyVehiclesSection />}
          {isOwner && activeTab === 'insurance' && <MyInsuranceSection />}
          {isOwner && activeTab === 'issues' && <MyIssuesSectionContainer />}
          {isOwner && activeTab === 'contributions' && <MyContributionsSection />}
          {isOwner && activeTab === 'business' && <MyBusinessSection />}
        </section>
      </div>
    </div>
  );
}
