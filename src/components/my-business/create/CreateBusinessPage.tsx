'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

// 🎯 Các loại hình doanh nghiệp hợp lệ
const VALID_BUSINESS_TYPES: BusinessType[] = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];

// ✅ Chuyển từ query param → BusinessType
function resolveBusinessType(type: string | null): BusinessType | null {
  return VALID_BUSINESS_TYPES.includes(type as BusinessType) ? (type as BusinessType) : null;
}

export default function CreateBusinessPage() {
  const { user, role } = useUser();
  const { t } = useTranslation('common');
  const router = useRouter();

  const [type, setType] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  // 🧭 Lấy type từ URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setType(params.get('type'));
    }
  }, []);

  // ✅ Điều hướng nếu đã tồn tại agent
  useEffect(() => {
    if (!user) return;

    if (role === 'staff') {
      router.replace('/dashboard/staff');
      return;
    }

    const checkExistingAgent = async () => {
      const snap = await getDocs(
        query(collection(db, 'agents'), where('ownerId', '==', user.uid))
      );
      if (!type && !snap.empty) {
        router.replace('/dashboard/agent');
      }
    };

    checkExistingAgent();
  }, [user, role, type, router]);

  // ✅ Xác định loại hình doanh nghiệp từ type
  useEffect(() => {
    const resolved = resolveBusinessType(type);
    setBusinessType(resolved);

    if (!resolved && type !== null) {
      setDialog({
        open: true,
        type: 'error',
        title: t('create_business_page.error_title'),
        description: t('create_business_page.error_description'),
      });
    }
  }, [type, t]);

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/Cover_desktop.jpg')" }}
    >
      <Header />
      <main className="flex-grow flex justify-center items-center px-4 py-24">
        <div className="bg-white bg-opacity-90 shadow-2xl rounded-[32px] p-10 w-full max-w-3xl border border-gray-200">
          {businessType ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">
                  {t(`create_business_page.title.${businessType}`, {
                    defaultValue: 'Create Business',
                  })}
                </h1>
                <div className="w-16 h-[3px] bg-[#00d289] mx-auto mt-3 mb-4 rounded-full" />
                <p className="text-gray-600 text-sm md:text-base">
                  {t('create_business_page.subtitle')}
                </p>
              </div>
              <CreateBusinessForm BusinessType ={businessType} />
            </>
          ) : (
            <div className="text-center text-red-600 font-semibold text-lg">
              {t('create_business_page.invalid_type')}
            </div>
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
