'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/src/components/ui/input';
import { createCustomer, getAllCustomers, updateCustomer } from '@/src/lib/services/customers/customerService';
import { auth } from '@/src/firebaseConfig';
import { Timestamp } from 'firebase/firestore';

interface IDUploaderProps {
  onExtracted: (userInfo: {
    name: string;
    idNumber: string;
    rawText: string;
  }) => void;
}

export default function IDUploader({ onExtracted }: IDUploaderProps) {
  const { t } = useTranslation('common');

  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrText('');
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const {
        name = '',
        idNumber = '',
        rawText = '',
        address = '',
        sex = '',
        nationality = '',
        placeOfOrigin = '',
        placeOfResidence = '',
        dateOfBirth = null,
      } = data;

      if (!name || !idNumber) throw new Error('Could not extract sufficient information from ID');

      setOcrText(rawText);
      onExtracted({ name, idNumber, rawText });

      const customers = await getAllCustomers();
      const existing = customers.find((c) => c.idNumber === idNumber);

      let parsedDateOfBirth: Timestamp | null = null;
      if (dateOfBirth) {
        const parsedDate = new Date(dateOfBirth);
        if (!isNaN(parsedDate.getTime())) {
          parsedDateOfBirth = Timestamp.fromDate(parsedDate);
        }
      }

      const customerData = {
        userId: auth.currentUser?.uid || '',
        name,
        idNumber,
        email: '',
        phone: '',
        address,
        driverLicense: '',
        dateOfBirth: parsedDateOfBirth,
        sex,
        nationality,
        placeOfOrigin,
        placeOfResidence,
      };

      if (existing) {
        await updateCustomer(existing.id, customerData);
        setMessage(t('id_uploader.updated_success'));
      } else {
        await createCustomer(customerData);
        setMessage(t('id_uploader.created_success'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(t('id_uploader.ocr_failed', { error: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={loading}
        aria-label={t('id_uploader.upload_file')}
      />
      {fileName && (
        <div className="text-sm text-gray-600">
          {t('id_uploader.uploaded_file', { fileName })}{' '}
          {loading && <span className="italic">– {t('id_uploader.processing')}</span>}
        </div>
      )}
      {message && <div className="text-sm text-blue-700 font-medium">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
