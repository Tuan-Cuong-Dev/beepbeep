'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useInsurancePackageById } from '@/src/hooks/useInsurancePackageById';

export default function ExtendInsuranceForm() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const { currentPackage, loading } = useInsurancePackageById(id);
  const { extend } = useInsurancePackages();

  const [extraDays, setExtraDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<NotificationType>('info');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  const handleExtend = async () => {
    if (!currentPackage) return;

    // ⛔ Validate
    if (!currentPackage.isActive) {
      setDialogType('error');
      setDialogTitle('Cannot Extend');
      setDialogDescription('This insurance package is not yet activated.');
      setDialogOpen(true);
      return;
    }

    if (!currentPackage.expiredAt) {
      setDialogType('error');
      setDialogTitle('Missing Expiry Date');
      setDialogDescription('This package has no expiry date. Cannot proceed.');
      setDialogOpen(true);
      return;
    }

    // ✅ Proceed
    setSubmitting(true);
    try {
      await extend(currentPackage.id, extraDays);
      setDialogType('success');
      setDialogTitle('Successfully Extended');
      setDialogDescription(`The package has been extended by ${extraDays} days.`);
    } catch (error) {
      console.error(error);
      setDialogType('error');
      setDialogTitle('Extension Failed');
      setDialogDescription('Something went wrong. Please try again later.');
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

  if (loading) return <p className="p-4 text-gray-500">⏳ Loading package...</p>;
  if (!currentPackage) return <p className="p-4 text-red-500">❌ Insurance package not found.</p>;

  return (
    <>
      <main className="max-w-xl mx-auto p-6 bg-white shadow rounded space-y-4 mt-10">
        <h1 className="text-xl font-semibold">🛡️ Extend Insurance Package</h1>

        <div className="text-sm text-gray-700 space-y-1">
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
            <p className="text-red-500">⚠️ This package is not active yet.</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Extend by (days)</label>
          <Input
            type="number"
            value={extraDays}
            onChange={(e) => setExtraDays(parseInt(e.target.value))}
            min={1}
            max={365}
            className="mt-1"
          />
        </div>

        <Button onClick={handleExtend} disabled={submitting}>
          {submitting ? 'Processing...' : 'Extend Now'}
        </Button>
      </main>

      <NotificationDialog
        open={dialogOpen}
        type={dialogType}
        title={dialogTitle}
        description={dialogDescription}
        onClose={handleDialogClose}
      />
    </>
  );
}
