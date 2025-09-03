'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import CreateBusinessForm from '@/src/components/my-business/create/CreateBusinessForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import {
  BusinessType,
  BUSINESS_TYPE_LABELS,
} from '@/src/lib/my-business/businessTypes';
import { BUSINESS_ROUTE_CONFIG } from '@/src/lib/my-business/routeConfig';

// ⬇️ quan trọng: import động để đảm bảo UI nhóm luôn render client-side
const OrganizationPickerGrouped = dynamic(
  () => import('@/src/components/my-business/organizations/OrganizationPickerGrouped'),
  { ssr: false }
);

/* ---------------------------------- helpers --------------------------------- */

const VALID_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];

const resolveBusinessType = (type: string | null): BusinessType | null =>
  VALID_BUSINESS_TYPES.includes(type as BusinessType) ? (type as BusinessType) : null;

/* ----------------------------------- page ----------------------------------- */

export default function CreateBusinessPage() {
  const { user, role } = useUser();
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams?.get('type') ?? null;
  const businessType = useMemo(() => resolveBusinessType(typeParam), [typeParam]);

  const [checking, setChecking] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const openDialog = (type: 'success' | 'error' | 'info', title: string, description = '') =>
    setDialog({ open: true, type, title, description });

  // 🚦 Staff → chuyển thẳng
  useEffect(() => {
    if (!user) return;
    if (role === 'staff') router.replace('/dashboard/staff');
  }, [user, role, router]);

  // 🛡️ Nếu có ?type nhưng không hợp lệ → show dialog (picker vẫn render bên dưới)
  useEffect(() => {
    if (typeParam !== null && !businessType) {
      openDialog(
        'error',
        t('create_business_page.error_title'),
        t('create_business_page.error_description')
      );
    }
  }, [typeParam, businessType, t]);

  // 🔍 Chỉ kiểm tra tồn tại khi có businessType hợp lệ
  useEffect(() => {
    const checkExists = async () => {
      if (!user || !businessType || role === 'staff') return;
      const cfg = BUSINESS_ROUTE_CONFIG[businessType];
      if (!cfg) return;

      setChecking(true);
      try {
        const snap = await getDocs(
          query(collection(db, cfg.collection), where('ownerId', '==', user.uid))
        );
        if (!snap.empty) router.replace(cfg.redirect);
      } finally {
        setChecking(false);
      }
    };
    checkExists();
  }, [user, role, businessType, router]);

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
          : t('create_business_page.choose_subtitle', { defaultValue: 'Pick the type that fits your business.' })}
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
          {businessType ? (
            <>
              {HeaderBlock}
              {/* Form tạo doanh nghiệp */}
              {checking ? (
                <div className="text-center text-gray-600">
                  {t('create_business_page.checking_existing')}
                </div>
              ) : (
                <CreateBusinessForm businessType={businessType} />
              )}
            </>
          ) : (
            <>
              {HeaderBlock}
              {/* Luôn render picker nhóm khi không có/không hợp lệ type */}
              <OrganizationPickerGrouped />
            </>
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
