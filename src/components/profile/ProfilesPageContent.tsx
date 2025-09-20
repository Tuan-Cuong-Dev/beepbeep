// Date : 16/09/2025
// Giữ nguyên UI hiện có; chỉ điều kiện hoá render theo yêu cầu

'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
import ShowcaseSwitcher from '@/src/components/showcase/ShowcaseSwitcher';

import LoginPopup from '@/src/components/auth/LoginPopup';
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
  const [activeTab, setActiveTab] = useState<TabType>('activityFeed');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // ⬇️ NEW: companyId suy luận khi users/{uid} chưa có companyId
  const [derivedCompanyId, setDerivedCompanyId] = useState<string | undefined>(undefined);

  // Lấy tab & uid từ query (giữ nguyên)
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as TabType | null;
    const uidParam = searchParams?.get('uid');

    if (uidParam) setProfileUserId(uidParam);
    else if (currentUser?.uid) setProfileUserId(currentUser.uid);
    else setProfileUserId(null);

    if (tabParam && ALL_TABS.includes(tabParam)) setActiveTab(tabParam);
  }, [searchParams, currentUser?.uid]);

  // Chưa đăng nhập → mở popup; không render tabs + main content
  useEffect(() => {
    setShowLoginPopup(!currentUser);
  }, [currentUser]);

  // Luôn fetch users/{uid} để render header + sidebar public
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setUserData(null);
      if (!profileUserId) return;
      try {
        const ref = doc(db, 'users', profileUserId);
        const snap = await getDoc(ref);
        if (!cancelled) setUserData(snap.exists() ? snap.data() : null);
      } catch {
        if (!cancelled) setUserData(null);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [profileUserId]);

  // ⬇️ NEW: tự resolve companyId chuẩn theo vai trò khi thiếu
  useEffect(() => {
    let cancelled = false;

    const resolveCompanyId = async () => {
      setDerivedCompanyId(undefined);

      if (!profileUserId || !userData) return;

      const role = String(userData.role || '').toLowerCase();

      // Nếu users/{uid} đã có companyId thì không cần resolve
      if (userData.companyId) return;

      try {
        // 1) company_owner → rentalCompanies.ownerId == profileUserId
        if (role === 'company_owner') {
          const snap = await getDocs(
            query(collection(db, 'rentalCompanies'), where('ownerId', '==', profileUserId))
          );
          const cid = snap.docs[0]?.id as string | undefined;
          if (!cancelled && cid) {
            setDerivedCompanyId(cid);
            return;
          }
        }

        // 2) station_manager → lấy từ rentalStations/{stationId}
        if (role === 'station_manager' && userData.stationId) {
          const st = await getDoc(doc(db, 'rentalStations', userData.stationId as string));
          const cid = st.exists() ? ((st.data() as any)?.companyId as string | undefined) : undefined;
          if (!cancelled && cid) {
            setDerivedCompanyId(cid);
            return;
          }
        }

        // 3) Dự phòng staff → staff.userId == profileUserId ⇒ companyId
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('userId', '==', profileUserId))
        );
        const cid = (staffSnap.docs[0]?.data() as any)?.companyId as string | undefined;
        if (!cancelled && cid) setDerivedCompanyId(cid);
      } catch {
        if (!cancelled) setDerivedCompanyId(undefined);
      }
    };

    resolveCompanyId();
    return () => { cancelled = true; };
  }, [profileUserId, userData?.role, userData?.companyId, userData?.stationId]);

  const isOwner = !!(currentUser?.uid && profileUserId && currentUser.uid === profileUserId);
  const allowedTabs = (isOwner ? ALL_TABS : PUBLIC_TABS) as TabType[];

  // Nếu không có quyền tab hiện tại → đưa về activityFeed (như cũ)
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

  // ⬇️ NEW: ưu tiên users/{uid}.companyId; nếu thiếu dùng derivedCompanyId
  const businessId = (userData?.companyId ?? derivedCompanyId) as string | undefined;

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

  const showSidebarOnMobile = activeTab === 'activityFeed';

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header + Cover (giữ nguyên) */}
      <div className="bg-white shadow-sm">
        <ProfileOverview
          userId={profileUserId!}
          userPrefetched={userData || {}}
          isOwner={isOwner}
          onEditProfile={() => router.push('/account/profile')}
        />
      </div>

      {/* Tabs (GIỮ UI CŨ): 
          - Nếu chưa đăng nhập → KHÔNG render block tabs
          - Nếu đã đăng nhập → render tabs với allowedTabs (người lạ chỉ thấy 2 tab)
      */}
      {currentUser && (
        <div className="bg-white border-t border-b sticky top-0 z-10">
          <ProfileTabs
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            userId={profileUserId || undefined}
            allowedTabs={allowedTabs}
            canConfigure={!!isOwner}
          />
        </div>
      )}

      {/* Main layout (GIỮ NGUYÊN BỐ CỤC) */}
      <div className="max-w-6xl mx-auto px_4 md:px-8 py-6 md:flex md:gap-6">
        {/* Sidebar luôn hiển thị */}
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

        {/* Content cột phải */}
        <section className="w-full md:flex-[1_1_66.666%] md:max-w-[66.666%] space-y-6 mt-6 md:mt-0 min-w-0">
          {currentUser && (
            <>
              {activeTab === 'activityFeed' && <ProfileMainContent activeTab="activityFeed" />}

              {activeTab === 'showcase' && (
                <ShowcaseSwitcher
                  role={userData?.role}
                  profileUserId={profileUserId!}
                  companyId={businessId}  
                  limitPerRow={12}
                  onlyAvailable
                />
              )}

              {isOwner && activeTab === 'vehicles' && <MyVehiclesSection />}
              {isOwner && activeTab === 'insurance' && <MyInsuranceSection />}
              {isOwner && activeTab === 'issues' && <MyIssuesSectionContainer />}
              {isOwner && activeTab === 'contributions' && <MyContributionsSection />}
              {isOwner && activeTab === 'business' && <MyBusinessSection />}
            </>
          )}
        </section>
      </div>

      {/* Login popup (overlay) — không thay đổi UI nền */}
      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}
