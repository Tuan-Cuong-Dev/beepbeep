'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import CreateBusinessForm from '@/src/components/my-business/CreateBusinessForm';
import CreateAgentForm from '@/src/components/my-business/CreateAgentForm';
import { BusinessType, BUSINESS_TYPE_LABELS } from '@/src/lib/my-business/businessTypes';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function CreateBusinessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role } = useUser(); // ✅ lấy role từ context
  const typeParam = searchParams?.get('type');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    description = ''
  ) => {
    setDialog({ open: true, type, title, description });
  };

  useEffect(() => {
    // ✅ Nếu role là 'staff' → chuyển hướng đến trang staff
    if (role === 'staff') {
      router.replace('/my-business/staff');
      return;
    }

    // ✅ Nếu là agent đã tồn tại → chuyển hướng luôn
    const checkAgent = async () => {
      if (!user) return;
      const snap = await getDocs(
        query(collection(db, 'agents'), where('ownerId', '==', user.uid))
      );
      if (!typeParam && !snap.empty) {
        router.replace('/my-business/agent');
      }
    };

    checkAgent();
  }, [user, role, router, typeParam]);

  useEffect(() => {
    if (
      typeParam === 'rental_company' ||
      typeParam === 'private_provider' ||
      typeParam === 'agent'
    ) {
      setBusinessType(typeParam);
    } else {
      setBusinessType(null);
      if (typeParam !== null) {
        showDialog(
          'error',
          'Invalid Business Type',
          'Please go back and select a valid business type.'
        );
      }
    }
  }, [typeParam]);

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
                  {businessType === 'agent'
                    ? 'Create an Agent'
                    : `Create a ${BUSINESS_TYPE_LABELS[businessType]}`}
                </h1>
                <div className="w-16 h-[3px] bg-[#00d289] mx-auto mt-3 mb-4 rounded-full" />
                <p className="text-gray-600 text-sm md:text-base">
                  Please fill in the details below to get started.
                </p>
              </div>
              {businessType === 'agent' ? (
                <CreateAgentForm />
              ) : (
                <CreateBusinessForm businessType={businessType} />
              )}
            </>
          ) : (
            <div className="text-center text-red-600 font-semibold text-lg">
              ❌ Invalid business type. Please go back and select a valid option.
            </div>
          )}
        </div>
      </main>

      <Footer />

      {dialog.open && (
        <NotificationDialog
          open={dialog.open}
          type={dialog.type}
          title={dialog.title}
          description={dialog.description}
          onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
}
