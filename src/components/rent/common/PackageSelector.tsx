'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { SimpleSelect } from '@/src/components/ui/select';

interface PackageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void;
  companyId?: string;
}

export default function PackageSelector({
  value,
  onChange,
  onNotify,
  companyId,
}: PackageSelectorProps) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        const q = query(
          collection(db, 'subscriptionPackages'),
          where('companyId', '==', companyId),
          where('status', '==', 'available') // ✅ chỉ lấy gói đang hoạt động
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            label: `${data.name} (${data.durationType})`,
            value: doc.id,
          };
        });
        setOptions(list);
      } catch (err) {
        console.error('❌ Error fetching packages:', err);
        onNotify?.('Failed to load subscription packages.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [companyId]);

  return (
    <SimpleSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={loading ? '🔄 Loading packages...' : '-- Select a package --'}
    />
  );
}
