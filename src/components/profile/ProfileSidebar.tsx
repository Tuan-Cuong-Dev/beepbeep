// Thông tin bên trái của UI của profiles
// Date : 16/09/2025

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '@/src/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

import BusinessAboutSection from '../my-business/about/BusinessAboutSection';
import ServicesAboutSection from '../my-business/about/ServicesAboutSections';

import type { BusinessType } from '@/src/lib/my-business/businessTypes';
import type { Staff } from '@/src/lib/staff/staffTypes';
import type { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';

// ✅ QR component để tạo link tới trang showcase của agent
import ProfileQR from '@/src/components/profile/ProfileQR';

interface ProfileSidebarProps {
  businessId?: string;
  businessType?: BusinessType;
  currentUserId?: string;     // uid của profile đang xem (ưu tiên prop, fallback auth)
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;

  /** QR config */
  showQRForShowcase?: boolean;     // mặc định: true
  qrBaseUrl?: string;              // ví dụ: 'http://192.168.31.91:3000'
  onlyOwnerCanSeeQR?: boolean;     // chỉ chủ tài khoản mới thấy QR (mặc định: false)
}

export default function ProfileSidebar({
  businessId,
  businessType,
  currentUserId,
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,

  showQRForShowcase = true,
  qrBaseUrl,
  onlyOwnerCanSeeQR = false,
}: ProfileSidebarProps) {
  const { t } = useTranslation('common');

  // ✅ Lấy uid đang render (profile) từ prop hoặc từ auth
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(currentUserId);
  useEffect(() => {
    if (currentUserId) {
      setResolvedUserId(currentUserId);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setResolvedUserId(u?.uid || undefined);
    });
    return () => unsub();
  }, [currentUserId]);

  const [authUid, setAuthUid] = useState<string | undefined>(undefined);
  // lưu auth uid để biết có phải chủ tài khoản không
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthUid(u?.uid || undefined));
    return () => unsub();
  }, []);

  // auto-detect business nếu không truyền từ parent
  const [staffBusinessId, setStaffBusinessId] = useState<string | undefined>();
  const [staffBusinessType, setStaffBusinessType] = useState<BusinessType | undefined>();
  const [loadingAutoDetect, setLoadingAutoDetect] = useState(false);

  // Riêng private_provider: lấy ownerId để ServicesAboutSection dùng userId
  const [ownerUserId, setOwnerUserId] = useState<string | undefined>(undefined);

  const hasParentBusiness = useMemo(
    () => Boolean(businessId && businessType),
    [businessId, businessType]
  );

  useEffect(() => {
    if (hasParentBusiness) {
      setStaffBusinessId(undefined);
      setStaffBusinessType(undefined);
      return;
    }
    if (!resolvedUserId) {
      setStaffBusinessId(undefined);
      setStaffBusinessType(undefined);
      return;
    }

    let mounted = true;

    const autoDetectOrg = async () => {
      setLoadingAutoDetect(true);
      try {
        // 1) users/{uid}.business
        const userRef = doc(db, 'users', resolvedUserId);
        const userSnap = await getDoc(userRef);
        if (!mounted) return;

        const userData = userSnap.exists() ? (userSnap.data() as any) : null;
        const biz = userData?.business as
          | { id?: string; type?: BusinessType; collection?: string; subtype?: string }
          | undefined;

        if (biz?.id && biz?.type) {
          setStaffBusinessId(biz.id);
          setStaffBusinessType(biz.type);
          setLoadingAutoDetect(false);
          return;
        }

        // 2) staff → rentalCompanies
        const qStaffs = query(
          collection(db, 'staffs'),
          where('userId', '==', resolvedUserId),
          where('accepted', '==', true)
        );
        const staffSnap = await getDocs(qStaffs);
        if (!mounted) return;

        if (!staffSnap.empty) {
          const sd = staffSnap.docs[0];
          const { id: _dropId, ...rawStaff } = sd.data() as Staff;
          const staffData: Staff = { ...rawStaff, id: sd.id };

          const companyRef = doc(db, 'rentalCompanies', staffData.companyId);
          const companySnap = await getDoc(companyRef);
          if (!mounted) return;

          if (companySnap.exists()) {
            const { id: _ignored, ...rawCompany } = companySnap.data() as RentalCompany;
            const company: RentalCompany = { ...rawCompany, id: companySnap.id };
            setStaffBusinessId(company.id);
            setStaffBusinessType(company.businessType as BusinessType);
            setLoadingAutoDetect(false);
            return;
          }
        }

        // 3) owner → technicianPartners
        const qTech = query(
          collection(db, 'technicianPartners'),
          where('ownerId', '==', resolvedUserId)
        );
        const techSnap = await getDocs(qTech);
        if (!mounted) return;

        if (!techSnap.empty) {
          const d = techSnap.docs[0];
          setStaffBusinessId(d.id);
          setStaffBusinessType('technician_partner');
          setLoadingAutoDetect(false);
          return;
        }

        // 4) owner → privateProviders
        const qPrivate = query(
          collection(db, 'privateProviders'),
          where('ownerId', '==', resolvedUserId)
        );
        const privateSnap = await getDocs(qPrivate);
        if (!mounted) return;

        if (!privateSnap.empty) {
          const d = privateSnap.docs[0];
          setStaffBusinessId(d.id);
          setStaffBusinessType('private_provider');
          setLoadingAutoDetect(false);
          return;
        }

        // (tùy chọn) thêm collection khác…

        // không tìm thấy
        setStaffBusinessId(undefined);
        setStaffBusinessType(undefined);
      } catch (e) {
        console.error('ProfileSidebar.autoDetectOrg error:', e);
        if (!mounted) return;
        setStaffBusinessId(undefined);
        setStaffBusinessType(undefined);
      } finally {
        if (mounted) setLoadingAutoDetect(false);
      }
    };

    autoDetectOrg();
    return () => {
      mounted = false;
    };
  }, [hasParentBusiness, resolvedUserId]);

  // Ưu tiên dữ liệu business từ parent
  const finalBusinessId = hasParentBusiness ? businessId : staffBusinessId;
  const finalBusinessType = hasParentBusiness ? businessType : staffBusinessType;

  // Lấy ownerId cho private_provider
  useEffect(() => {
    let mounted = true;
    (async () => {
      setOwnerUserId(undefined);
      if (!finalBusinessId || finalBusinessType !== 'private_provider') return;

      try {
        const snap = await getDoc(doc(db, 'privateProviders', finalBusinessId));
        if (!mounted) return;
        if (snap.exists()) {
          const { ownerId } = snap.data() as { ownerId?: string };
          if (ownerId) setOwnerUserId(ownerId);
        }
      } catch (e) {
        console.warn('fetch ownerId (privateProviders) failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, [finalBusinessId, finalBusinessType]);

  // ⚙️ Quyết định có hiển thị QR không
  const canShowQR = useMemo(() => {
    if (!showQRForShowcase) return false;
    if (!resolvedUserId) return false;              // cần uid để build URL
    if (onlyOwnerCanSeeQR && authUid !== resolvedUserId) return false;
    return true;
  }, [showQRForShowcase, resolvedUserId, onlyOwnerCanSeeQR, authUid]);

  return (
    <div className="w-full space-y-6 rounded-lg">
      {/* QR tới Showcase của agent */}
      {canShowQR && (
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
          <ProfileQR userId={resolvedUserId!} baseUrl={qrBaseUrl} />
        </div>
      )}

      {/* Business + Services */}
      {finalBusinessId && finalBusinessType ? (
        <>
          <BusinessAboutSection
            businessId={finalBusinessId}
            businessType={finalBusinessType}
          />

          {finalBusinessType === 'private_provider' ? (
            <ServicesAboutSection
              userId={ownerUserId || resolvedUserId}
              statusIn={['active', 'pending', 'inactive']}
            />
          ) : (
            <ServicesAboutSection
              businessId={finalBusinessId}
              statusIn={['active', 'pending', 'inactive']}
            />
          )}
        </>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            {loadingAutoDetect
              ? t('common.loading', 'Đang tải...')
              : t('business_about.not_found')}
          </p>
        </div>
      )}
    </div>
  );
}
