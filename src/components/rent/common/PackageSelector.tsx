'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { SimpleSelect } from '@/src/components/ui/select';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
          where('status', '==', 'available')
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
        onNotify?.(t('package_selector.load_error'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [companyId, t, onNotify]);

  return (
    <SimpleSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={loading ? t('package_selector.loading') : t('package_selector.placeholder')}
    />
  );
}
