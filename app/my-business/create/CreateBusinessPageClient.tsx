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

export default function CreateBusinessPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role, user } = useUser();

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
    if (!user) return;

    if (role === 'admin') {
      showDialog(
        'error',
        'Admins cannot create business',
        'Please return to the dashboard.'
      );
      router.replace('/my-business');
      return;
    }

    if (role === 'staff') {
      router.replace('/my-business/staff');
      return;
    }

    if (!typeParam) {
      setBusinessType(null); // Chưa chọn → sẽ hiện UI chọn
      return;
    }

    if (['rental_company', 'private_provider', 'agent'].includes(typeParam)) {
      setBusinessType(typeParam as BusinessType);
      return;
    }

    // type không hợp lệ
    showDialog(
      'error',
      'Invalid Business Type',
      'Please go back and select a valid business type.'
    );
  }, [user, role, typeParam, router]);

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/Cover2.jpg')" }}
    >
      <Header />

      <main className="flex-grow flex justify-center items-center px-4 py-24">
        <div className="bg-white bg-opacity-90 shadow-2xl rounded-[32px] p-10 w-full max-w-3xl border border-gray-200">

          {/* Nếu chưa chọn type → chọn loại hình doanh nghiệp */}
          {!typeParam && (
            <div className="space-y-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800">Choose your Business Type</h1>
              <p className="text-gray-600">Please select what kind of business you want to create:</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <BusinessTypeOption label="Rental Company" type="rental_company" />
                <BusinessTypeOption label="Private Provider" type="private_provider" />
                <BusinessTypeOption label="Agent" type="agent" />
              </div>
            </div>
          )}

          {/* Nếu đã chọn type → show form */}
          {businessType && (
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

function BusinessTypeOption({ label, type }: { label: string; type: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/my-business/create?type=${type}`)}
      className="p-6 bg-[#00d289] hover:bg-[#00b67a] text-white rounded-xl font-semibold transition"
    >
      {label}
    </button>
  );
}
