'use client';
// Scan chứng minh nhân dân.
import { useState } from 'react';
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
        dateOfBirth = null, // 👈 dạng chuỗi hoặc null
      } = data;

      if (!name || !idNumber) throw new Error('Could not extract sufficient information from ID');

      setOcrText(rawText);
      onExtracted({ name, idNumber, rawText });

      const customers = await getAllCustomers();
      const existing = customers.find((c) => c.idNumber === idNumber);

      // 👇 Chuyển dateOfBirth thành Timestamp nếu hợp lệ
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
        dateOfBirth: parsedDateOfBirth, // 👈 đã kiểm tra an toàn
        sex,
        nationality,
        placeOfOrigin,
        placeOfResidence,
      };

      if (existing) {
        await updateCustomer(existing.id, customerData);
        setMessage('✅ Customer information has been updated.');
      } else {
        await createCustomer(customerData);
        setMessage('✅ New customer has been created.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('⚠️ OCR failed: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input type="file" accept="image/*" onChange={handleUpload} disabled={loading} />
      {fileName && (
        <div className="text-sm text-gray-600">
          📄 Uploaded: {fileName} {loading && <span className="italic">– Processing...</span>}
        </div>
      )}
      {message && <div className="text-sm text-blue-700 font-medium">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
