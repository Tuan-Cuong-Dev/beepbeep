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

  // ✅ Dùng để auto phát hiện org khi không truyền businessId/businessType
  currentUserId?: string;

  // existing (để dành)
  location?: string;
  joinedDate?: string;
  helpfulVotes?: number;
}

// Map BusinessType -> Firestore collection
const COLLECTION_BY_TYPE: Record<BusinessType, string> = {
  rental_company: 'rentalCompanies',
  private_provider: 'privateProviders',
  agent: 'agents',
  technician_partner: 'technicianPartners',
  intercity_bus: 'intercityBusCompanies',
  vehicle_transport: 'vehicleTransporters',
  tour_guide: 'tourGuides',
};

export default function ProfileSidebar({
  businessId,
  businessType,
  currentUserId,
  location = 'Da Nang, Vietnam',
  joinedDate = 'Mar 2025',
  helpfulVotes = 0,
}: ProfileSidebarProps) {
  const { t } = useTranslation('common');

  // State nội bộ khi cần tự tìm doanh nghiệp
  const [staffBusinessId, setStaffBusinessId] = useState<string | undefined>();
  const [staffBusinessType, setStaffBusinessType] = useState<BusinessType | undefined>();
  const [loadingAutoDetect, setLoadingAutoDetect] = useState(false);

  // Có nguồn businessId/businessType từ parent không?
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
    if (!currentUserId) {
      setStaffBusinessId(undefined);
      setStaffBusinessType(undefined);
      return;
    }

    let mounted = true;

    const autoDetectOrg = async () => {
      setLoadingAutoDetect(true);
      try {
        // 1) Ưu tiên lấy từ users/{uid}.business (đã set khi tạo business)
        const userRef = doc(db, 'users', currentUserId);
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

        // 2) Fallback staff: chỉ lịch sử cho rentalCompanies (như logic cũ)
        const qStaffs = query(
          collection(db, 'staffs'),
          where('userId', '==', currentUserId),
          where('accepted', '==', true)
        );
        const staffSnap = await getDocs(qStaffs);
        if (!mounted) return;

        if (!staffSnap.empty) {
          const sd = staffSnap.docs[0];
          const { id: _dropId, ...rawStaff } = sd.data() as Staff;
          const staffData: Staff = { ...rawStaff, id: sd.id };

          // Lấy company record tương ứng
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

        // 3) Fallback chủ sở hữu technicianPartners (ownerId == currentUserId)
        const qTech = query(
          collection(db, 'technicianPartners'),
          where('ownerId', '==', currentUserId)
        );
        const techSnap = await getDocs(qTech);
        if (!mounted) return;

        if (!techSnap.empty) {
          const d = techSnap.docs[0];
          const data = d.data() as any;
          setStaffBusinessId(d.id);
          setStaffBusinessType('technician_partner');
          setLoadingAutoDetect(false);
          return;
        }

        // 4) (tùy chọn) Có thể thêm các collection khác có ownerId == uid nếu muốn

        // Không tìm được
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
  }, [hasParentBusiness, currentUserId]);

  // Ưu tiên nguồn từ parent, nếu không có thì dùng auto-detect
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
          <ServicesAboutSection
            businessId={finalBusinessId}
            statusIn={['active', 'pending', 'inactive']}
          />
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
