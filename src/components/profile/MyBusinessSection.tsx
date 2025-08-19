'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MyServiceList from '@/src/components/my-business/services/MyServiceList';
import MyOrganizationInfo from '@/src/components/my-business/organizations/MyOrganizationInfo';
import { OrgCardData } from '@/src/lib/organizations/getUserOrganizations';
import { TechnicianSubtype } from '@/src/lib/organizations/serviceCategoryMapping';

import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import type { Staff } from '@/src/lib/staff/staffTypes';
import type { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';

export default function MyBusinessSection() {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [organizations, setOrganizations] = useState<OrgCardData[]>([]);
  const [staffCompany, setStaffCompany] = useState<RentalCompany | null>(null);
  const [staffRole, setStaffRole] = useState<Staff['role'] | null>(null);

  // ✅ Tìm tổ chức mà user là chủ doanh nghiệp
  const ownerOrg = organizations.find((org) => org.userRoleInOrg === 'owner');

  // ✅ Nếu là technician_partner thì lấy subtype
  const technicianSubtype: TechnicianSubtype | undefined =
    ownerOrg?.type === 'technician_partner' && ownerOrg.subtype
      ? (ownerOrg.subtype as TechnicianSubtype)
      : undefined;

  // ✅ Nếu KHÔNG phải owner → thử load tổ chức mà user là staff
  useEffect(() => {
    let mounted = true;

    const loadStaffCompany = async () => {
      if (!user?.uid) return;

      // Nếu là owner thì KHÔNG hiển thị staff org
      if (ownerOrg) {
        if (mounted) {
          setStaffCompany(null);
          setStaffRole(null);
        }
        return;
      }

      try {
        // Tìm staff record đã accepted của user
        const qStaffs = query(
          collection(db, 'staffs'),
          where('userId', '==', user.uid),
          where('accepted', '==', true)
        );

        const snap = await getDocs(qStaffs);
        if (snap.empty) {
          if (mounted) {
            setStaffCompany(null);
            setStaffRole(null);
          }
          return;
        }

        // ✅ Loại bỏ id trong data staff
        const staffDoc = snap.docs[0];
        const { id: _ignoredStaff, ...restStaff } = staffDoc.data() as Staff;
        const staffData: Staff = { ...restStaff, id: staffDoc.id };

        if (mounted) setStaffRole(staffData.role);

        // ✅ Lấy thông tin công ty — loại bỏ id trong data company
        const companyRef = doc(db, 'rentalCompanies', staffData.companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          if (mounted) setStaffCompany(null);
          return;
        }

        const { id: _ignoredCompany, ...restCompany } =
          companySnap.data() as RentalCompany;
        const company: RentalCompany = { ...restCompany, id: companySnap.id };

        if (mounted) setStaffCompany(company);
      } catch (err) {
        console.error('loadStaffCompany error:', err);
        if (mounted) {
          setStaffCompany(null);
          setStaffRole(null);
        }
      }
    };

    loadStaffCompany();
    return () => {
      mounted = false;
    };
  }, [user?.uid, ownerOrg]);




  return (
    <div className="space-y-10">
      {/* Nếu là staff → CHỈ hiển thị Staff Org */}
      {staffCompany ? (
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            {t('my_business_section.staff_orgs_title', 'Your Staff Organization')}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 border rounded-lg shadow-sm bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{staffCompany.name}</p>
                  {staffCompany.displayAddress && (
                    <p className="text-sm text-gray-600">{staffCompany.displayAddress}</p>
                  )}
                  {staffCompany.phone && (
                    <p className="text-sm text-gray-600">☎ {staffCompany.phone}</p>
                  )}
                  {staffCompany.email && (
                    <p className="text-sm text-gray-600">✉ {staffCompany.email}</p>
                  )}
                  {staffCompany.website && (
                    <a
                      href={staffCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline mt-1 inline-block"
                    >
                      {staffCompany.website}
                    </a>
                  )}
                </div>
                {staffRole && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                    {t(`staff_roles.${staffRole}`, staffRole)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* SECTION 1: Organization info (chỉ khi không phải staff) */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
              {t('my_business_section.organization_title')}
            </h2>
            <MyOrganizationInfo onLoaded={setOrganizations} />
          </section>

          {/* SECTION 2: Services (chỉ hiển thị nếu là owner) */}
          {ownerOrg && (
            <section>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                {t('my_business_section.services_title')}
              </h2>
              <MyServiceList
                userId={ownerOrg.ownerId}
                orgType={ownerOrg.type}
                technicianSubtype={technicianSubtype}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
