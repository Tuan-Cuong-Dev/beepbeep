// Bắt đầu thiết kế cái này từ 12.08.2025
// components/profile/ProfileSidebar.tsx

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
import { db } from '@/src/firebaseConfig';

import BusinessAboutSection from '../my-business/about/BusinessAboutSection';
import ServicesAboutSection from '../my-business/about/ServicesAboutSections';

import type { BusinessType } from '@/src/lib/my-business/businessTypes';
import type { Staff } from '@/src/lib/staff/staffTypes';
import type { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';

interface ProfileSidebarProps {
  // ✅ Ưu tiên dùng nếu có (owner / trang doanh nghiệp)
  businessId?: string;
  businessType?: BusinessType;

  // ✅ Dùng để auto phát hiện staff org khi không truyền businessId/businessType
  currentUserId?: string;

  // existing (để dành, nếu cần hiển thị thêm info user)
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;
}

export default function ProfileSidebar({
  businessId,
  businessType,
  currentUserId,
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,
}: ProfileSidebarProps) {
  const { t } = useTranslation('common');

  // State nội bộ khi cần tự tìm doanh nghiệp staff
  const [staffBusinessId, setStaffBusinessId] = useState<string | undefined>();
  const [staffBusinessType, setStaffBusinessType] = useState<BusinessType | undefined>();
  const [loadingStaffOrg, setLoadingStaffOrg] = useState(false);

  // Có nguồn businessId/businessType từ parent không?
  const hasParentBusiness = useMemo(
    () => Boolean(businessId && businessType),
    [businessId, businessType]
  );

  useEffect(() => {
    // Nếu parent đã truyền business → không cần tự tìm
    if (hasParentBusiness) {
      setStaffBusinessId(undefined);
      setStaffBusinessType(undefined);
      return;
    }

    // Nếu không có user → không tìm được staff org
    if (!currentUserId) {
      setStaffBusinessId(undefined);
      setStaffBusinessType(undefined);
      return;
    }

    let mounted = true;

    const loadStaffOrg = async () => {
      setLoadingStaffOrg(true);
      try {
        // 1) Lấy staff record đã accepted của user
        const qStaffs = query(
          collection(db, 'staffs'),
          where('userId', '==', currentUserId),
          where('accepted', '==', true)
        );

        const snap = await getDocs(qStaffs);
        if (!mounted) return;

        if (snap.empty) {
          setStaffBusinessId(undefined);
          setStaffBusinessType(undefined);
          setLoadingStaffOrg(false);
          return;
        }

        // Chỉ lấy 1 org theo yêu cầu
        const staffDoc = snap.docs[0];

        // Tránh "id overwritten": bỏ id trong data nếu có
        const { id: _ignoredStaffId, ...restStaff } = staffDoc.data() as Staff;
        const staffData: Staff = { ...restStaff, id: staffDoc.id };

        // 2) Lấy company tương ứng
        const companyRef = doc(db, 'rentalCompanies', staffData.companyId);
        const companySnap = await getDoc(companyRef);
        if (!mounted) return;

        if (!companySnap.exists()) {
          setStaffBusinessId(undefined);
          setStaffBusinessType(undefined);
          setLoadingStaffOrg(false);
          return;
        }

        // Bỏ id trong data company, dùng doc.id
        const { id: _ignoredCompanyId, ...restCompany } =
          companySnap.data() as RentalCompany;
        const company: RentalCompany = { ...restCompany, id: companySnap.id };

        // businessType nằm trong company.businessType
        setStaffBusinessId(company.id);
        setStaffBusinessType(company.businessType as BusinessType);
      } catch (e) {
        console.error('ProfileSidebar.loadStaffOrg error:', e);
        if (!mounted) return;
        setStaffBusinessId(undefined);
        setStaffBusinessType(undefined);
      } finally {
        if (mounted) setLoadingStaffOrg(false);
      }
    };

    loadStaffOrg();
    return () => {
      mounted = false;
    };
  }, [hasParentBusiness, currentUserId]);

  // Ưu tiên nguồn từ parent, nếu không có thì dùng staff org
  const finalBusinessId = hasParentBusiness ? businessId : staffBusinessId;
  const finalBusinessType = hasParentBusiness ? businessType : staffBusinessType;

  return (
    <div className="w-full space-y-6 rounded-lg">
      {finalBusinessId && finalBusinessType ? (
        <>
          <BusinessAboutSection
            businessId={finalBusinessId}
            businessType={finalBusinessType}
          />

          {/* Nếu services lưu theo businessId thì chỉ cần businessId.
             Nếu services lưu theo userId, bạn có thể truyền thêm userId (ở đây dùng currentUserId). */}
          {/* Hiển thị dịch vụ gắn với DOANH NGHIỆP */}
            <ServicesAboutSection
              businessId={finalBusinessId}
              statusIn={['active', 'pending', 'inactive']}
            />
        </>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            {loadingStaffOrg
              ? t('common.loading', 'Đang tải...')
              : t('business_about.not_found')}
          </p>
        </div>
      )}
    </div>
  );
}
