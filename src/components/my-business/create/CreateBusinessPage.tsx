'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import CreateBusinessForm from '@/src/components/my-business/create/CreateBusinessForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { useAuth } from '@/src/hooks/useAuth';
import { getUserOrganizations } from '@/src/lib/organizations/getUserOrganizations';

import {
  BusinessType,
  BUSINESS_TYPE_LABELS,
} from '@/src/lib/my-business/businessTypes';

const OrganizationPickerGrouped = dynamic(
  () => import('@/src/components/my-business/organizations/OrganizationPickerGrouped'),
  { ssr: false }
);

// helpers
const VALID_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];
const resolveBusinessType = (type: string | null): BusinessType | null =>
  VALID_BUSINESS_TYPES.includes(type as BusinessType) ? (type as BusinessType) : null;

export default function CreateBusinessPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth(); // ✅ chỉ lấy currentUser

  const typeParam = searchParams?.get('type') ?? null;
  const businessType = useMemo(() => resolveBusinessType(typeParam), [typeParam]);

  const [checking, setChecking] = useState(true);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });
  const redirectedRef = useRef(false);

  const openDialog = (type: 'success' | 'error' | 'info', title: string, description = '') =>
    setDialog({ open: true, type, title, description });

  // Có ?type nhưng không hợp lệ → cảnh báo (nhưng vẫn check org để auto-redirect)
  useEffect(() => {
    if (typeParam !== null && !businessType) {
      openDialog(
        'error',
        t('create_business_page.error_title'),
        t('create_business_page.error_description')
      );
    }
  }, [typeParam, businessType, t]);

  // ✅ Tham chiếu đúng logic MyOrganizationInfo: nếu user đã có bất kỳ org nào → /dashboard
  useEffect(() => {
    const run = async () => {
      if (!currentUser || redirectedRef.current) {
        setChecking(false);
        return;
      }
      try {
        const orgs = await getUserOrganizations(currentUser.uid);
        if (orgs.length > 0 && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace('/dashboard');
          return;
        }
      } catch (e) {
        console.error('check organizations failed', e);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [currentUser, router]);

  const HeaderBlock = (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800">
        {businessType
          ? t(`create_business_page.title.${businessType}`, { defaultValue: 'Create Business' })
          : t('create_business_page.choose_title', { defaultValue: 'Choose your organization' })}
      </h1>
      <div className="w-16 h-[3px] bg-[#00d289] mx-auto mt-3 mb-4 rounded-full" />
      <p className="text-gray-600 text-sm md:text-base">
        {businessType
          ? t('create_business_page.subtitle')
          : t('create_business_page.choose_subtitle', {
              defaultValue: 'Pick the type that fits your business.',
            })}
      </p>
    </div>
  );

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/Cover_desktop.jpg')" }}
    >
      <Header />

      <main className="flex-grow flex justify-center items-center px-4 py-24">
        <div className="bg-white/90 shadow-2xl rounded-[32px] p-10 w-full max-w-3xl border border-gray-200">
          {HeaderBlock}

          {checking ? (
            <div className="text-center text-gray-600">
              {t('create_business_page.checking_existing', {
                defaultValue: 'Đang kiểm tra tổ chức của bạn…',
              })}
            </div>
          ) : businessType ? (
            <CreateBusinessForm businessType={businessType} />
          ) : (
            <OrganizationPickerGrouped />
          )}
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
