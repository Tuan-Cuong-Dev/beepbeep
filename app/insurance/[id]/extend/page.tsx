'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useInsurancePackageById } from '@/src/hooks/useInsurancePackageById';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

// Helper to extract ID safely
function getIdFromParams(param: any): string | undefined {
  if (!param) return undefined;
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return param[0];
  if (typeof param === 'object' && 'id' in param) {
    const value = param.id;
    return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

export default function ExtendInsuranceForm() {
  const params = useParams();
  const id = getIdFromParams(params);
  const router = useRouter();

  const { currentPackage, loading } = useInsurancePackageById(id);
  const { extend } = useInsurancePackages();

  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<NotificationType>('info');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  const extraDays = 365;

  const handleExtend = async () => {
    if (!currentPackage) return;

    if (!currentPackage.isActive) {
      setDialogType('error');
      setDialogTitle('Extension Not Allowed');
      setDialogDescription('Only active packages can be extended.');
      setDialogOpen(true);
      return;
    }

    if (!currentPackage.expiredAt) {
      setDialogType('error');
      setDialogTitle('Missing Expiry Date');
      setDialogDescription('This package does not have an expiry date.');
      setDialogOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await extend(currentPackage.id, extraDays);
      setDialogType('success');
      setDialogTitle('Extension Successful');
      setDialogDescription(`Package extended by ${extraDays} days.`);
    } catch (error) {
      console.error(error);
      setDialogType('error');
      setDialogTitle('Extension Failed');
      setDialogDescription('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    if (dialogType === 'success') {
      router.push('/my-insurance');
    }
  };

  if (!id) {
    return <div className="p-6 text-center text-red-500">❌ Invalid or missing package ID.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">⏳ Loading insurance package...</div>;
  }

  if (!currentPackage) {
    return <div className="p-6 text-center text-red-500">❌ Insurance package not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="max-w-xl mx-auto p-6 flex-grow">
        <h1 className="text-xl font-semibold mb-4">🛡️ Extend Insurance Package</h1>

        <div className="text-sm text-gray-700 space-y-1 mb-4">
          <p>
            <strong>Package Code:</strong>{' '}
            <span className="font-mono">{currentPackage.packageCode}</span>
          </p>

          {currentPackage.expiredAt && (
            <p>
              <strong>Current Expiry:</strong>{' '}
              {safeFormatDate(currentPackage.expiredAt.toDate())}
            </p>
          )}

          {!currentPackage.isActive && (
            <p className="text-red-500">⚠️ Only active packages can be extended.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium">Extend by (days)</label>
          <Input type="number" value={extraDays} disabled className="mt-1" />
          <p className="text-xs text-gray-500 mt-1">
            Currently only supports extension by 365 days.
          </p>
        </div>

        <Button
          onClick={handleExtend}
          disabled={submitting || !currentPackage.isActive}
          className="w-full"
        >
          {submitting ? 'Processing...' : 'Extend Now'}
        </Button>
      </main>

      <Footer />

      <NotificationDialog
        open={dialogOpen}
        type={dialogType}
        title={dialogTitle}
        description={dialogDescription}
        onClose={handleDialogClose}
      />
    </div>
  );
}
